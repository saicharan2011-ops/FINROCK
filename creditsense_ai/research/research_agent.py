"""
research_agent.py — CreditSense AI
Autonomous research agent for corporate credit appraisal.

Uses an OpenAI-compatible client (Groq / HF / other) to investigate
company news, MCA records, court filings, and promoter background.

IMPORTANT:
- This module is designed to be safe-by-default in local dev.
- If required environment variables are missing, the agent returns a
  structured fallback (no crashes).
"""

from __future__ import annotations

import json
import logging
import os
import time
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, field_validator

logger = logging.getLogger("research_agent")


class ResearchResult(BaseModel):
    company_name: str
    research_timestamp: str

    news_summary: str = Field(description="Key recent developments (≤200 words)")
    news_sentiment: str = Field(description="positive | neutral | negative | critical")
    news_sources: list[str] = Field(default_factory=list)

    litigation_found: bool
    litigation_details: str = Field(default="")
    litigation_count: int = Field(default=0)
    nclt_cases: bool = Field(default=False)
    high_court_cases: bool = Field(default=False)
    supreme_court_cases: bool = Field(default=False)
    litigation_risk: float = Field(ge=0.0, le=1.0)

    mca_flags: list[str] = Field(default_factory=list)
    regulatory_actions: list[str] = Field(default_factory=list)
    rbi_penalties: bool = Field(default=False)
    sebi_actions: bool = Field(default=False)
    sfio_investigation: bool = Field(default=False)

    promoter_name: str = Field(default="")
    promoter_concerns: str = Field(default="")
    promoter_risk_flags: list[str] = Field(default_factory=list)
    wilful_defaulter: bool = Field(default=False)
    loan_write_off: bool = Field(default=False)
    criminal_cases: bool = Field(default=False)

    circular_trading_signal: float = Field(ge=0.0, le=1.0, default=0.0)
    shell_company_signal: float = Field(ge=0.0, le=1.0, default=0.0)
    invoice_fraud_signal: float = Field(ge=0.0, le=1.0, default=0.0)
    loan_diversion_signal: float = Field(ge=0.0, le=1.0, default=0.0)

    overall_risk: float = Field(ge=0.0, le=1.0)
    confidence: float = Field(ge=0.0, le=1.0)
    research_gaps: list[str] = Field(default_factory=list)

    @field_validator("news_sentiment")
    @classmethod
    def validate_sentiment(cls, v: str) -> str:
        allowed = {"positive", "neutral", "negative", "critical"}
        return v.lower() if v and v.lower() in allowed else "neutral"

    @field_validator(
        "overall_risk",
        "litigation_risk",
        "confidence",
        "circular_trading_signal",
        "shell_company_signal",
        "invoice_fraud_signal",
        "loan_diversion_signal",
        mode="before",
    )
    @classmethod
    def clamp_float(cls, v) -> float:
        try:
            return round(max(0.0, min(1.0, float(v))), 4)
        except (TypeError, ValueError):
            return 0.3


SYSTEM_PROMPT = """You are a senior credit research analyst at an Indian bank, specialising in corporate loan appraisal and fraud detection.

Your task: investigate a company for credit risk using your knowledge of Indian corporate landscape, RBI guidelines, MCA records, and court systems.

ALWAYS respond with a single valid JSON object matching this exact schema:
{
  "company_name": string,
  "research_timestamp": "ISO-8601 datetime",
  "news_summary": string (≤200 words, key recent developments),
  "news_sentiment": "positive" | "neutral" | "negative" | "critical",
  "news_sources": [list of source types e.g. "ET", "Bloomberg", "BSE Filing"],
  "litigation_found": boolean,
  "litigation_details": string,
  "litigation_count": integer,
  "nclt_cases": boolean,
  "high_court_cases": boolean,
  "supreme_court_cases": boolean,
  "litigation_risk": float 0.0-1.0,
  "mca_flags": [list of MCA concerns],
  "regulatory_actions": [list of regulatory issues],
  "rbi_penalties": boolean,
  "sebi_actions": boolean,
  "sfio_investigation": boolean,
  "promoter_name": string,
  "promoter_concerns": string,
  "promoter_risk_flags": [list of specific flags],
  "wilful_defaulter": boolean,
  "loan_write_off": boolean,
  "criminal_cases": boolean,
  "circular_trading_signal": float 0.0-1.0,
  "shell_company_signal": float 0.0-1.0,
  "invoice_fraud_signal": float 0.0-1.0,
  "loan_diversion_signal": float 0.0-1.0,
  "overall_risk": float 0.0-1.0,
  "confidence": float 0.0-1.0,
  "research_gaps": [list of info you could not find]
}

Return ONLY the JSON. No preamble, no explanation, no markdown fences."""


def _build_research_prompt(company_name: str, loan_amount_cr: Optional[float], sector: Optional[str]) -> str:
    loan_ctx = f" seeking a ₹{loan_amount_cr} Cr loan" if loan_amount_cr else ""
    sector_ctx = f" operating in the {sector} sector" if sector else ""
    today = datetime.now().strftime("%d %B %Y")
    return f"""Research the Indian company "{company_name}"{sector_ctx}{loan_ctx} as of {today}.

Investigate:
1) Recent news (2 years)  2) Litigation  3) MCA/Regulatory  4) Promoter background  5) Fraud signals

Return the complete JSON as instructed."""


def _strip_markdown_fences(content: str) -> str:
    c = (content or "").strip()
    if not c.startswith("```"):
        return c
    parts = c.split("```")
    if len(parts) < 2:
        return c
    inner = parts[1].strip()
    if inner.startswith("json"):
        inner = inner[4:].strip()
    return inner.strip()


def _get_client():
    """
    Lazily import OpenAI client so environments without `openai` installed
    don't crash at import time.
    """
    try:
        from openai import OpenAI
    except Exception as e:
        raise RuntimeError("openai package not installed") from e

    api_key = os.getenv("HF_TOKEN") or os.getenv("GROQ_API_KEY") or os.getenv("OPENAI_API_KEY")
    base_url = os.getenv("API_BASE_URL") or os.getenv("OPENAI_BASE_URL") or os.getenv("GROQ_BASE_URL")
    model = os.getenv("MODEL_NAME") or os.getenv("OPENAI_MODEL")

    if not api_key or not base_url or not model:
        raise RuntimeError("Missing LLM env vars (HF_TOKEN/API_BASE_URL/MODEL_NAME)")

    client = OpenAI(api_key=api_key, base_url=base_url)
    return client, model


def _call_llm_with_retry(messages: list, max_tokens: int = 1200, max_retries: int = 3) -> str:
    client, model = _get_client()
    last_err: Optional[Exception] = None
    for attempt in range(max_retries):
        try:
            response = client.chat.completions.create(
                model=model,
                messages=messages,
                max_tokens=max_tokens,
                temperature=0.05,
                top_p=0.9,
            )
            content = response.choices[0].message.content or ""
            return _strip_markdown_fences(content)
        except Exception as e:
            last_err = e
            wait = 2 ** attempt
            logger.warning(f"LLM call attempt {attempt+1} failed: {e}. Retrying in {wait}s...")
            time.sleep(wait)
    raise RuntimeError(f"LLM unavailable after {max_retries} retries: {last_err}")


def _validate_and_refine(company_name: str, raw_json: str) -> str:
    validation_prompt = f"""You are a senior credit risk validator at an Indian bank.

Return corrected JSON only. If nothing needs changing, return original.

INPUT JSON:
{raw_json}"""
    messages = [
        {"role": "system", "content": "You are a credit risk validator. Return only valid JSON."},
        {"role": "user", "content": validation_prompt},
    ]
    return _call_llm_with_retry(messages, max_tokens=1200)


def _fallback_result(company_name: str, reason: str) -> ResearchResult:
    logger.error(f"Using fallback research result. Reason: {reason}")
    return ResearchResult(
        company_name=company_name,
        research_timestamp=datetime.now().isoformat(),
        news_summary=f"Automated research unavailable: {reason}. Manual investigation required.",
        news_sentiment="neutral",
        litigation_found=False,
        litigation_details="",
        litigation_risk=0.3,
        overall_risk=0.3,
        confidence=0.1,
        research_gaps=["All fields — LLM research failed", "Manual investigation required"],
    )


class ResearchAgent:
    def __init__(self, enable_validation_pass: bool = True):
        self.enable_validation_pass = enable_validation_pass

    def search_company(
        self,
        company_name: str,
        loan_amount_cr: Optional[float] = None,
        sector: Optional[str] = None,
    ) -> ResearchResult:
        logger.info(f"[ResearchAgent] Starting research: '{company_name}'")
        start_time = time.time()

        research_prompt = _build_research_prompt(company_name, loan_amount_cr, sector)
        messages_pass1 = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": research_prompt},
        ]

        try:
            raw_json = _call_llm_with_retry(messages_pass1, max_tokens=1200)
            logger.info(f"[ResearchAgent] Pass 1 complete ({time.time()-start_time:.1f}s)")
        except Exception as e:
            return _fallback_result(company_name, str(e))

        if self.enable_validation_pass:
            try:
                validated_json = _validate_and_refine(company_name, raw_json)
                logger.info(f"[ResearchAgent] Pass 2 complete ({time.time()-start_time:.1f}s)")
            except Exception as e:
                logger.warning(f"Validation pass failed ({e}), using pass-1 result")
                validated_json = raw_json
        else:
            validated_json = raw_json

        try:
            data = json.loads(validated_json)
            data["company_name"] = company_name
            data["research_timestamp"] = datetime.now().isoformat()
            result = ResearchResult(**data)
            logger.info(
                f"[ResearchAgent] Done. overall_risk={result.overall_risk} confidence={result.confidence} "
                f"({time.time()-start_time:.1f}s total)"
            )
            return result
        except Exception as e:
            logger.error(f"[ResearchAgent] Parse error: {e}\nRaw output:\n{validated_json[:500]}")
            return _fallback_result(company_name, f"JSON parse error: {e}")

    def search_company_dict(
        self,
        company_name: str,
        loan_amount_cr: Optional[float] = None,
        sector: Optional[str] = None,
    ) -> dict:
        return self.search_company(company_name, loan_amount_cr, sector).model_dump()

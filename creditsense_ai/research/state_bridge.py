"""
state_bridge.py — CreditSense AI
=================================
Maps ResearchResult + PromoterScorer output → CreditAppraisalEnv-v1 state schema.

ROOT CAUSE OF 0% GAUGES ON FRONTEND:
  The frontend reads from state.risk_scores dict.
  ResearchResult was never mapped into state.risk_scores.
  This module is the missing bridge.

Call this ONCE after research_agent.search_company() completes,
then pass the returned state dict to your env and to the frontend via SSE/WebSocket.
"""

from __future__ import annotations
import logging

try:
    from .research_agent import ResearchResult
    from .promoter_scorer import PromoterScorer
except ImportError:
    # Fallback for direct script execution.
    from research_agent import ResearchResult
    from promoter_scorer import PromoterScorer

logger = logging.getLogger("state_bridge")
_scorer = PromoterScorer()


def research_to_state(
    result: ResearchResult,
    existing_state: dict | None = None,
) -> dict:
    """
    Converts a ResearchResult into state fields for CreditAppraisalEnv-v1.

    Args:
        result:         Output of ResearchAgent.search_company()
        existing_state: Existing env state dict (will be updated in-place copy).
                        Pass None to get a fresh state fragment.

    Returns:
        Updated state dict with all risk_scores populated.
        Frontend reads from state["risk_scores"] for the 6 gauges.
    """
    r = result.model_dump()

    # -- Promoter score (uses full PromoterScorer logic) -----------------------
    promoter_score, breakdown = _scorer.score_with_breakdown(r)

    # -- Litigation score ------------------------------------------------------
    lit_score = float(r.get("litigation_risk", 0.0))
    if lit_score == 0.0:
        # Recompute from flags if LLM left it at 0
        lit = 0.0
        if r.get("litigation_found"):
            lit += 0.15
        if r.get("nclt_cases"):
            lit += 0.25
        if r.get("supreme_court_cases"):
            lit += 0.20
        if r.get("high_court_cases"):
            lit += 0.12
        if r.get("drt_cases"):
            lit += 0.10
        if r.get("cbi_cases"):
            lit += 0.22
        if r.get("ed_cases"):
            lit += 0.22
        count = min(int(r.get("litigation_count", 0)), 20)
        lit += min(0.10, count * 0.02)
        lit_score = round(min(lit, 1.0), 4)

    # -- Fraud signals (direct from ResearchResult) ----------------------------
    circular = round(max(float(r.get("circular_trading_signal", 0.0)), 0.0), 4)
    shell = round(max(float(r.get("shell_company_signal", 0.0)), 0.0), 4)
    invoice = round(max(float(r.get("invoice_fraud_signal", 0.0)), 0.0), 4)
    divert = round(max(float(r.get("loan_diversion_signal", 0.0)), 0.0), 4)
    lien = round(max(float(r.get("lien_exposure", 0.0)), 0.0), 4)

    # -- PEP screener ----------------------------------------------------------
    pep_score = 0.75 if r.get("pep_exposure") else (0.40 if r.get("criminal_cases") else 0.10)

    # -- Overall risk (weighted combination) -----------------------------------
    overall = round(
        0.30 * float(r.get("overall_risk", 0.3))
        + 0.25 * promoter_score
        + 0.20 * lit_score
        + 0.10 * circular
        + 0.08 * shell
        + 0.07 * max(invoice, divert),
        4,
    )
    overall = round(min(overall, 1.0), 4)

    # -- Build risk_scores dict (what the frontend gauges read from) -----------
    risk_scores = {
        # Frontend gauge keys (must match exactly what AgentView.jsx reads)
        "circular": circular,  # CIRCULAR gauge
        "shell_net": shell,  # SHELL NET gauge
        "lien_exp": lien,  # LIEN EXP gauge
        "pep_screener": round(pep_score, 4),  # PEP SCREENER gauge
        "promoter": promoter_score,
        "litigation": lit_score,
        "overall": overall,
        # Full fraud signals for env reward calculation
        "circular_trading_signal": circular,
        "shell_company_signal": shell,
        "invoice_fraud_signal": invoice,
        "loan_diversion_signal": divert,
        "lien_exposure": lien,
    }

    # -- Build research_summary for Live Metrics panel -------------------------
    research_summary = {
        "company_name": r["company_name"],
        "news_summary": r["news_summary"],
        "news_sentiment": r["news_sentiment"],
        "key_events_by_year": r.get("key_events_by_year", {}),
        "company_status": r.get("company_status", "Active"),
        "promoter_name": r.get("promoter_name", ""),
        "promoter_concerns": r.get("promoter_concerns", ""),
        "promoter_score": promoter_score,
        "promoter_narrative": breakdown.risk_narrative,
        "litigation_found": r.get("litigation_found", False),
        "litigation_details": r.get("litigation_details", ""),
        "litigation_count": r.get("litigation_count", 0),
        "nclt_cases": r.get("nclt_cases", False),
        "wilful_defaulter": r.get("wilful_defaulter", False),
        "sfio_investigation": r.get("sfio_investigation", False),
        "criminal_cases": r.get("criminal_cases", False),
        "mca_flags": r.get("mca_flags", []),
        "regulatory_actions": r.get("regulatory_actions", []),
        "research_gaps": r.get("research_gaps", []),
        "web_searches_performed": r.get("web_searches_performed", 0),
        "confidence": r.get("confidence", 0.0),
        "scoring_breakdown": breakdown.to_dict(),
    }

    # -- Merge into existing state or return fresh fragment --------------------
    base = existing_state.copy() if existing_state else {}
    base.update(
        {
            "risk_scores": risk_scores,
            "research_summary": research_summary,
            "research_complete": True,
            "agent_context": _build_agent_context(r, risk_scores),
        }
    )

    logger.info(
        f"[StateBridge] risk_scores populated: "
        f"circular={circular:.2f} shell={shell:.2f} "
        f"lien={lien:.2f} pep={pep_score:.2f} "
        f"promoter={promoter_score:.2f} lit={lit_score:.2f} "
        f"overall={overall:.2f}"
    )
    return base


def _build_agent_context(r: dict, scores: dict) -> str:
    """
    Generates the AGENT CONTEXT string shown in the bottom-right panel.
    Replaces the generic 'CAM generated.' with a real summary.
    """
    parts = []
    risk = scores["overall"]

    if risk >= 0.75:
        parts.append(f"HIGH RISK ({risk:.0%}). ")
    elif risk >= 0.50:
        parts.append(f"MODERATE RISK ({risk:.0%}). ")
    else:
        parts.append(f"LOW RISK ({risk:.0%}). ")

    if r.get("wilful_defaulter"):
        parts.append("Wilful defaulter on RBI list. ")
    if r.get("nclt_cases"):
        parts.append(f"NCLT cases found ({r.get('litigation_count',0)}). ")
    if r.get("sfio_investigation"):
        parts.append("Active SFIO investigation. ")
    if r.get("circular_trading_signal", 0) > 0.4:
        parts.append(f"Circular trading signal {r['circular_trading_signal']:.0%}. ")
    if r.get("promoter_concerns"):
        parts.append(f"Promoter: {r['promoter_concerns'][:80]}. ")
    if not parts[1:]:
        parts.append(f"No major adverse findings. Confidence: {r.get('confidence',0):.0%}.")

    return "".join(parts).strip()

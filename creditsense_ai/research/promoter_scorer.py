"""
promoter_scorer.py — CreditSense AI
Converts ResearchResult into a precise 0.0–1.0 promoter risk score
for the promoter_risk field in CreditAppraisalEnv-v1 state schema.

Scoring logic mirrors how a senior credit manager manually weights
promoter background signals — hard disqualifiers take absolute floors,
additive signals stack with diminishing returns to prevent over-inflation.
"""

import logging
import math
from dataclasses import dataclass, field
from typing import Optional

logger = logging.getLogger("promoter_scorer")

# ── High-risk keyword lists ────────────────────────────────────────────────────
_CRITICAL_KEYWORDS = {
    "fraud", "arrested", "chargesheeted", "conviction", "convicted",
    "wilful default", "wilful defaulter", "fugitive", "absconding",
    "money laundering", "hawala", "benami", "sfio", "ed raid",
    "cbi investigation", "fir filed", "look out notice", "interpol",
}

_HIGH_RISK_KEYWORDS = {
    "default", "npa", "write-off", "written off", "debt restructuring",
    "one-time settlement", "ots", "drt", "debt recovery",
    "winding up", "insolvency", "cirp", "liquidation",
    "income tax raid", "tax evasion", "gst fraud",
    "related party", "round tripping", "diversion", "siphoning",
    "show cause", "regulatory action", "sebi ban", "debarred",
}

_MODERATE_RISK_KEYWORDS = {
    "litigation", "dispute", "arbitration", "delayed payments",
    "overdue", "restructured", "classified", "downgraded",
    "resigned", "management change", "promoter pledge",
    "frequent auditor change", "qualified audit",
}


@dataclass
class ScoringBreakdown:
    """Audit trail of every signal that contributed to the final score."""
    base_score:               float = 0.0
    # Hard floors (set the minimum if triggered)
    wilful_defaulter_floor:   Optional[float] = None
    sfio_floor:               Optional[float] = None
    criminal_floor:           Optional[float] = None
    nclt_floor:               Optional[float] = None
    # Additive deltas
    litigation_delta:         float = 0.0
    regulatory_delta:         float = 0.0
    critical_keyword_delta:   float = 0.0
    high_risk_keyword_delta:  float = 0.0
    moderate_keyword_delta:   float = 0.0
    loan_write_off_delta:     float = 0.0
    rbi_penalty_delta:        float = 0.0
    sebi_delta:               float = 0.0
    fraud_signal_delta:       float = 0.0
    research_gap_delta:       float = 0.0
    # Applied floor (highest of all floors)
    applied_floor:            Optional[float] = None
    # Final
    pre_floor_score:          float = 0.0
    final_score:              float = 0.0
    triggered_flags:          list  = field(default_factory=list)


class PromoterScorer:
    """
    Converts a ResearchResult (dict or Pydantic model) into a calibrated
    0.0–1.0 promoter risk score.

    Design principles:
    1. Hard floors — certain disqualifiers impose a minimum score regardless
       of everything else (e.g., wilful defaulter always ≥ 0.85).
    2. Additive signals — other risk factors stack additively but with
       diminishing returns (using a compression formula) to avoid inflation.
    3. Transparency — ScoringBreakdown records every signal for CAM output.
    4. Confidence weighting — low-confidence research pulls score toward 0.4
       (uncertainty midpoint) rather than using raw value blindly.
    """

    # Hard floor thresholds (minimum score if flag is True)
    FLOOR_WILFUL_DEFAULTER = 0.85
    FLOOR_SFIO             = 0.80
    FLOOR_CRIMINAL         = 0.75
    FLOOR_NCLT             = 0.65
    FLOOR_RBI_PENALTY      = 0.60
    FLOOR_SEBI             = 0.60
    FLOOR_LOAN_WRITEOFF    = 0.55

    # Additive delta caps
    MAX_LITIGATION_DELTA     = 0.25
    MAX_KEYWORD_DELTA        = 0.25
    MAX_REGULATORY_DELTA     = 0.20
    MAX_FRAUD_SIGNAL_DELTA   = 0.20

    def score(self, research: dict) -> float:
        """
        Primary method. Returns final float score 0.0–1.0.

        Args:
            research: dict from ResearchResult.model_dump() or
                      ResearchAgent.search_company_dict()
        """
        result, breakdown = self._compute(research)
        return result

    def score_with_breakdown(self, research: dict) -> tuple[float, ScoringBreakdown]:
        """
        Returns (score, breakdown) — use this for CAM generation to explain
        why the promoter was scored as they were.
        """
        return self._compute(research)

    def _compute(self, r: dict) -> tuple[float, ScoringBreakdown]:
        bd = ScoringBreakdown()

        # ── 1. Base score from LLM overall_risk ───────────────────────────────
        # Use overall_risk as base but don't trust it fully — LLMs can be
        # overconfident. We cap the base contribution.
        llm_risk   = float(r.get("overall_risk", 0.3))
        confidence = float(r.get("confidence",   0.5))
        # Pull toward 0.35 (neutral) inversely proportional to confidence
        bd.base_score = round(llm_risk * confidence + 0.35 * (1 - confidence), 4)

        running = bd.base_score

        # ── 2. Hard disqualifier floors ────────────────────────────────────────
        floors: list[float] = []

        if r.get("wilful_defaulter"):
            bd.wilful_defaulter_floor = self.FLOOR_WILFUL_DEFAULTER
            bd.triggered_flags.append("WILFUL_DEFAULTER")
            floors.append(self.FLOOR_WILFUL_DEFAULTER)

        if r.get("sfio_investigation"):
            bd.sfio_floor = self.FLOOR_SFIO
            bd.triggered_flags.append("SFIO_INVESTIGATION")
            floors.append(self.FLOOR_SFIO)

        if r.get("criminal_cases"):
            bd.criminal_floor = self.FLOOR_CRIMINAL
            bd.triggered_flags.append("CRIMINAL_CASES")
            floors.append(self.FLOOR_CRIMINAL)

        if r.get("nclt_cases"):
            bd.nclt_floor = self.FLOOR_NCLT
            bd.triggered_flags.append("NCLT_CASES")
            floors.append(self.FLOOR_NCLT)

        if r.get("rbi_penalties"):
            bd.rbi_penalty_delta = self.FLOOR_RBI_PENALTY
            bd.triggered_flags.append("RBI_PENALTY")
            floors.append(self.FLOOR_RBI_PENALTY)

        if r.get("sebi_actions"):
            bd.sebi_delta = self.FLOOR_SEBI
            bd.triggered_flags.append("SEBI_ACTION")
            floors.append(self.FLOOR_SEBI)

        if r.get("loan_write_off"):
            bd.loan_write_off_delta = self.FLOOR_LOAN_WRITEOFF
            bd.triggered_flags.append("LOAN_WRITE_OFF")
            floors.append(self.FLOOR_LOAN_WRITEOFF)

        bd.applied_floor = max(floors) if floors else None

        # ── 3. Additive litigation delta ───────────────────────────────────────
        litigation_score = 0.0
        if r.get("litigation_found"):
            litigation_score += 0.10
            bd.triggered_flags.append("LITIGATION_FOUND")
        lit_count = int(r.get("litigation_count", 0))
        if lit_count > 0:
            # Diminishing returns: 0.03 per case up to cap
            litigation_score += min(0.12, lit_count * 0.03)
        if r.get("high_court_cases"):
            litigation_score += 0.05
        if r.get("supreme_court_cases"):
            litigation_score += 0.08
        # Also pull from LLM's litigation_risk field
        lit_risk = float(r.get("litigation_risk", 0.0))
        litigation_score = max(litigation_score, lit_risk * 0.3)
        bd.litigation_delta = round(min(litigation_score, self.MAX_LITIGATION_DELTA), 4)
        running += bd.litigation_delta

        # ── 4. Keyword analysis in promoter_concerns + litigation_details ──────
        text_corpus = " ".join([
            str(r.get("promoter_concerns", "")),
            str(r.get("litigation_details", "")),
            str(r.get("news_summary", "")),
            " ".join(r.get("promoter_risk_flags", [])),
            " ".join(r.get("mca_flags", [])),
            " ".join(r.get("regulatory_actions", [])),
        ]).lower()

        critical_hits = sum(1 for kw in _CRITICAL_KEYWORDS if kw in text_corpus)
        high_hits     = sum(1 for kw in _HIGH_RISK_KEYWORDS  if kw in text_corpus)
        moderate_hits = sum(1 for kw in _MODERATE_RISK_KEYWORDS if kw in text_corpus)

        # Diminishing returns formula: delta = cap * (1 - e^(-k*hits))
        bd.critical_keyword_delta  = round(min(0.20, 0.20 * (1 - math.exp(-0.8 * critical_hits))), 4)
        bd.high_risk_keyword_delta = round(min(0.12, 0.12 * (1 - math.exp(-0.5 * high_hits))), 4)
        bd.moderate_keyword_delta  = round(min(0.06, 0.06 * (1 - math.exp(-0.4 * moderate_hits))), 4)

        keyword_total = bd.critical_keyword_delta + bd.high_risk_keyword_delta + bd.moderate_keyword_delta
        bd.critical_keyword_delta = round(min(keyword_total, self.MAX_KEYWORD_DELTA), 4)
        running += bd.critical_keyword_delta

        if critical_hits > 0:
            bd.triggered_flags.append(f"CRITICAL_KEYWORDS({critical_hits})")
        if high_hits > 0:
            bd.triggered_flags.append(f"HIGH_RISK_KEYWORDS({high_hits})")

        # ── 5. Fraud signal deltas (from research_agent fraud signal fields) ───
        fraud_signals = [
            float(r.get("circular_trading_signal", 0.0)),
            float(r.get("shell_company_signal",    0.0)),
            float(r.get("invoice_fraud_signal",    0.0)),
            float(r.get("loan_diversion_signal",   0.0)),
        ]
        # Use max signal with a dampening factor (don't double-count with keywords)
        max_fraud = max(fraud_signals)
        bd.fraud_signal_delta = round(min(max_fraud * 0.35, self.MAX_FRAUD_SIGNAL_DELTA), 4)
        running += bd.fraud_signal_delta
        if max_fraud > 0.5:
            bd.triggered_flags.append(f"FRAUD_SIGNAL(max={max_fraud:.2f})")

        # ── 6. Research gaps penalty (incomplete info → higher uncertainty) ─────
        gaps = r.get("research_gaps", [])
        if len(gaps) >= 3:
            bd.research_gap_delta = 0.05
            running += bd.research_gap_delta
            bd.triggered_flags.append(f"RESEARCH_GAPS({len(gaps)})")

        # ── 7. Negative sentiment amplifier ───────────────────────────────────
        sentiment = str(r.get("news_sentiment", "neutral")).lower()
        if sentiment == "critical":
            running *= 1.12
        elif sentiment == "negative":
            running *= 1.06

        # ── 8. Apply hard floor ────────────────────────────────────────────────
        bd.pre_floor_score = round(min(running, 1.0), 4)
        if bd.applied_floor is not None:
            bd.final_score = round(max(bd.pre_floor_score, bd.applied_floor), 4)
        else:
            bd.final_score = bd.pre_floor_score

        # Clamp to [0.0, 1.0]
        bd.final_score = round(max(0.0, min(1.0, bd.final_score)), 4)

        logger.info(
            f"[PromoterScorer] base={bd.base_score} "
            f"lit_delta={bd.litigation_delta} "
            f"kw_delta={bd.critical_keyword_delta} "
            f"fraud_delta={bd.fraud_signal_delta} "
            f"floor={bd.applied_floor} "
            f"→ final={bd.final_score} "
            f"flags={bd.triggered_flags}"
        )
        return bd.final_score, bd

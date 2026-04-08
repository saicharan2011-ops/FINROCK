"""
promoter_scorer.py — CreditSense AI (FIXED)
============================================
Converts ResearchResult into a calibrated 0.0–1.0 promoter risk score.
Every scoring decision is logged in ScoringBreakdown for CAM generation.

FIX vs broken version:
  BROKEN: simple base + 0.3 if litigation → ignored wilful_defaulter floors,
          ignored research confidence, ignored fraud signals, no breakdown
  FIXED:  hard RBI floors → additive deltas with diminishing returns →
          confidence weighting → full audit trail in ScoringBreakdown
"""

import math
import logging
from dataclasses import dataclass, field
from typing import Optional

logger = logging.getLogger("promoter_scorer")

# ── Keyword lists for text-mining promoter_concerns + news_summary ────────────
_CRITICAL_KW = {
    "fraud", "arrested", "chargesheeted", "convicted", "conviction",
    "wilful default", "wilful defaulter", "fugitive", "absconding",
    "money laundering", "hawala", "benami", "sfio", "ed raid",
    "cbi investigation", "fir filed", "look out notice", "interpol",
    "financial crime", "diversion", "siphoning",
}
_HIGH_KW = {
    "default", "npa", "write-off", "written off", "debt restructuring",
    "one-time settlement", "ots", "drt", "debt recovery",
    "winding up", "insolvency", "cirp", "liquidation",
    "income tax raid", "tax evasion", "gst fraud",
    "related party", "round tripping", "shell company",
    "show cause", "regulatory action", "sebi ban", "debarred",
}
_MODERATE_KW = {
    "litigation", "dispute", "arbitration", "delayed payments",
    "overdue", "restructured", "classified", "downgraded",
    "resigned", "promoter pledge", "auditor change", "qualified audit",
    "contingent liability", "legal notice",
}


@dataclass
class ScoringBreakdown:
    """Full audit trail of every signal — used by cam_generator.py."""
    # Base
    base_score:              float = 0.0
    llm_overall_risk:        float = 0.0
    llm_confidence:          float = 0.0

    # Hard floors (set absolute minimums)
    floor_wilful_defaulter:  Optional[float] = None
    floor_sfio:              Optional[float] = None
    floor_criminal:          Optional[float] = None
    floor_nclt:              Optional[float] = None
    floor_rbi:               Optional[float] = None
    floor_sebi:              Optional[float] = None
    floor_write_off:         Optional[float] = None
    floor_ed_cbi:            Optional[float] = None
    applied_floor:           Optional[float] = None

    # Additive deltas
    delta_litigation:        float = 0.0
    delta_critical_kw:       float = 0.0
    delta_high_kw:           float = 0.0
    delta_moderate_kw:       float = 0.0
    delta_fraud_signals:     float = 0.0
    delta_sentiment:         float = 0.0
    delta_research_gaps:     float = 0.0
    delta_pep:               float = 0.0

    # Result
    pre_floor_score:         float = 0.0
    final_score:             float = 0.0
    triggered_flags:         list  = field(default_factory=list)
    risk_narrative:          str   = ""

    def to_dict(self) -> dict:
        return self.__dict__.copy()


class PromoterScorer:
    """
    Produces a calibrated promoter risk score for CreditAppraisalEnv-v1.

    Scoring architecture:
      1. Base score    — LLM's overall_risk weighted by its own confidence
      2. Hard floors   — RBI-mandated minimums for serious disqualifiers
      3. Additive stack — litigation + keywords + fraud signals (diminishing returns)
      4. Sentiment     — news_sentiment amplifies the running total
      5. Floor apply   — final = max(running, applied_floor)
      6. Clamp         — [0.0, 1.0]
    """

    # Hard floor thresholds (minimum scores per RBI credit policy)
    F_WILFUL     = 0.85
    F_SFIO       = 0.80
    F_CRIMINAL   = 0.75
    F_ED_CBI     = 0.72
    F_NCLT       = 0.65
    F_RBI        = 0.60
    F_SEBI       = 0.60
    F_WRITE_OFF  = 0.55

    # Delta caps (prevents individual signal from dominating)
    CAP_LIT      = 0.25
    CAP_KW       = 0.22
    CAP_FRAUD    = 0.20
    CAP_SENT     = 0.12

    def score(self, research: dict) -> float:
        """Main entry point — returns float 0.0–1.0."""
        final, _ = self._compute(research)
        return final

    def score_with_breakdown(self, research: dict) -> tuple[float, ScoringBreakdown]:
        """Returns (score, breakdown) for CAM narrative generation."""
        return self._compute(research)

    def _compute(self, r: dict) -> tuple[float, ScoringBreakdown]:
        bd = ScoringBreakdown()
        bd.llm_overall_risk = float(r.get("overall_risk", 0.3))
        bd.llm_confidence   = float(r.get("confidence",   0.4))

        # ── 1. Base score (confidence-weighted LLM estimate) ─────────────────
        # Low confidence → pull toward neutral 0.35; high confidence → trust LLM
        bd.base_score = round(
            bd.llm_overall_risk * bd.llm_confidence
            + 0.35 * (1.0 - bd.llm_confidence),
            4
        )
        running = bd.base_score

        # ── 2. Hard disqualifier floors ──────────────────────────────────────
        floors = []

        if r.get("wilful_defaulter"):
            bd.floor_wilful_defaulter = self.F_WILFUL
            floors.append(self.F_WILFUL)
            bd.triggered_flags.append("WILFUL_DEFAULTER")

        if r.get("sfio_investigation"):
            bd.floor_sfio = self.F_SFIO
            floors.append(self.F_SFIO)
            bd.triggered_flags.append("SFIO_INVESTIGATION")

        if r.get("criminal_cases"):
            bd.floor_criminal = self.F_CRIMINAL
            floors.append(self.F_CRIMINAL)
            bd.triggered_flags.append("CRIMINAL_CASES")

        if r.get("ed_cases") or r.get("cbi_cases"):
            bd.floor_ed_cbi = self.F_ED_CBI
            floors.append(self.F_ED_CBI)
            bd.triggered_flags.append("ED_OR_CBI_CASES")

        if r.get("nclt_cases"):
            bd.floor_nclt = self.F_NCLT
            floors.append(self.F_NCLT)
            bd.triggered_flags.append("NCLT_CASES")

        if r.get("rbi_penalties"):
            bd.floor_rbi = self.F_RBI
            floors.append(self.F_RBI)
            bd.triggered_flags.append("RBI_PENALTY")

        if r.get("sebi_actions"):
            bd.floor_sebi = self.F_SEBI
            floors.append(self.F_SEBI)
            bd.triggered_flags.append("SEBI_ACTION")

        if r.get("loan_write_off"):
            bd.floor_write_off = self.F_WRITE_OFF
            floors.append(self.F_WRITE_OFF)
            bd.triggered_flags.append("LOAN_WRITE_OFF")

        bd.applied_floor = max(floors) if floors else None

        # ── 3. Litigation additive delta ─────────────────────────────────────
        lit = 0.0
        if r.get("litigation_found"):
            lit += 0.08
        count = min(int(r.get("litigation_count", 0)), 20)
        lit += min(0.10, count * 0.025)            # 0.025 per case, cap 0.10
        if r.get("high_court_cases"):    lit += 0.04
        if r.get("supreme_court_cases"): lit += 0.07
        if r.get("drt_cases"):           lit += 0.05
        # Also honour the LLM's own litigation_risk estimate
        lit = max(lit, float(r.get("litigation_risk", 0.0)) * 0.35)
        bd.delta_litigation = round(min(lit, self.CAP_LIT), 4)
        running += bd.delta_litigation
        if bd.delta_litigation > 0.05:
            bd.triggered_flags.append(f"LITIGATION(Δ={bd.delta_litigation:.2f})")

        # ── 4. Keyword analysis (diminishing returns via exponential) ─────────
        corpus = " ".join(filter(None, [
            str(r.get("promoter_concerns",   "")),
            str(r.get("promoter_background", "")),
            str(r.get("litigation_details",  "")),
            str(r.get("news_summary",        "")),
            " ".join(r.get("promoter_risk_flags", [])),
            " ".join(r.get("mca_flags",          [])),
            " ".join(r.get("regulatory_actions", [])),
        ])).lower()

        c_hits = sum(1 for kw in _CRITICAL_KW if kw in corpus)
        h_hits = sum(1 for kw in _HIGH_KW     if kw in corpus)
        m_hits = sum(1 for kw in _MODERATE_KW if kw in corpus)

        # delta = cap × (1 − e^(−k × hits))  → diminishing returns
        d_crit = 0.20 * (1 - math.exp(-0.9 * c_hits))
        d_high = 0.12 * (1 - math.exp(-0.6 * h_hits))
        d_mod  = 0.06 * (1 - math.exp(-0.4 * m_hits))
        kw_total = min(d_crit + d_high + d_mod, self.CAP_KW)
        bd.delta_critical_kw = round(kw_total, 4)
        running += bd.delta_critical_kw
        if c_hits:
            bd.triggered_flags.append(f"CRITICAL_KW({c_hits}hits)")
        if h_hits:
            bd.triggered_flags.append(f"HIGH_KW({h_hits}hits)")

        # ── 5. Fraud signals delta ────────────────────────────────────────────
        fraud_vals = [
            float(r.get("circular_trading_signal", 0.0)),
            float(r.get("shell_company_signal",    0.0)),
            float(r.get("invoice_fraud_signal",    0.0)),
            float(r.get("loan_diversion_signal",   0.0)),
        ]
        max_fraud = max(fraud_vals) if fraud_vals else 0.0
        # Use max (not sum) to avoid double-counting with keyword analysis
        bd.delta_fraud_signals = round(min(max_fraud * 0.30, self.CAP_FRAUD), 4)
        running += bd.delta_fraud_signals
        if max_fraud > 0.4:
            bd.triggered_flags.append(f"FRAUD_SIGNAL(max={max_fraud:.2f})")

        # ── 6. PEP exposure ───────────────────────────────────────────────────
        if r.get("pep_exposure"):
            bd.delta_pep = 0.08
            running += bd.delta_pep
            bd.triggered_flags.append("PEP_EXPOSURE")

        # ── 7. Research gaps (uncertainty premium) ────────────────────────────
        gaps = r.get("research_gaps", [])
        if len(gaps) >= 4:
            bd.delta_research_gaps = 0.06
            running += bd.delta_research_gaps
            bd.triggered_flags.append(f"RESEARCH_GAPS({len(gaps)})")
        elif len(gaps) >= 2:
            bd.delta_research_gaps = 0.03
            running += bd.delta_research_gaps

        # ── 8. Sentiment multiplier ───────────────────────────────────────────
        sentiment = str(r.get("news_sentiment", "neutral")).lower()
        mult = {"critical": 1.14, "negative": 1.07, "neutral": 1.0, "positive": 0.94}.get(sentiment, 1.0)
        running *= mult
        bd.delta_sentiment = round(running * (mult - 1.0), 4)
        if mult != 1.0:
            bd.triggered_flags.append(f"SENTIMENT_{sentiment.upper()}(×{mult})")

        # ── 9. Apply floor & clamp ────────────────────────────────────────────
        bd.pre_floor_score = round(min(running, 1.0), 4)
        if bd.applied_floor is not None:
            bd.final_score = round(max(bd.pre_floor_score, bd.applied_floor), 4)
        else:
            bd.final_score = bd.pre_floor_score
        bd.final_score = round(max(0.0, min(1.0, bd.final_score)), 4)

        # ── 10. Generate narrative for CAM ───────────────────────────────────
        bd.risk_narrative = _build_narrative(r, bd)

        logger.info(
            f"[PromoterScorer] base={bd.base_score:.3f} "
            f"lit_Δ={bd.delta_litigation:.3f} kw_Δ={bd.delta_critical_kw:.3f} "
            f"fraud_Δ={bd.delta_fraud_signals:.3f} floor={bd.applied_floor} "
            f"→ {bd.final_score:.4f} | flags={bd.triggered_flags}"
        )
        return bd.final_score, bd


def _build_narrative(r: dict, bd: ScoringBreakdown) -> str:
    """Generates a plain-English explanation of the promoter risk score."""
    parts = []
    name = r.get("promoter_name", "The promoter")

    if bd.final_score >= 0.80:
        parts.append(f"{name} presents CRITICAL risk (score {bd.final_score:.2f}).")
    elif bd.final_score >= 0.60:
        parts.append(f"{name} presents HIGH risk (score {bd.final_score:.2f}).")
    elif bd.final_score >= 0.40:
        parts.append(f"{name} presents MODERATE risk (score {bd.final_score:.2f}).")
    else:
        parts.append(f"{name} presents LOW risk (score {bd.final_score:.2f}).")

    if r.get("wilful_defaulter"):
        parts.append("Classified as wilful defaulter by RBI/CIBIL — hard floor 0.85 applied.")
    if r.get("sfio_investigation"):
        parts.append("Active SFIO investigation — hard floor 0.80 applied.")
    if r.get("criminal_cases"):
        parts.append("Criminal cases / FIR on record — hard floor 0.75 applied.")
    if r.get("nclt_cases"):
        parts.append(f"NCLT proceedings found ({r.get('litigation_count',0)} cases).")
    if bd.delta_fraud_signals > 0.05:
        parts.append(f"Fraud signal detected (max signal: {max(r.get('circular_trading_signal',0), r.get('shell_company_signal',0), r.get('invoice_fraud_signal',0), r.get('loan_diversion_signal',0)):.2f}).")
    if r.get("promoter_concerns"):
        parts.append(f"Concerns: {r['promoter_concerns'][:120]}...")

    return " ".join(parts) if parts else f"Promoter risk score: {bd.final_score:.2f}. No major flags triggered."

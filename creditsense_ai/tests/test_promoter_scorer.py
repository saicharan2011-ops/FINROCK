"""
Tests for PromoterScorer — validates calibration, hard floors,
additive deltas, and edge cases.
"""

import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from creditsense_ai.research.promoter_scorer import PromoterScorer, ScoringBreakdown


scorer = PromoterScorer()


def _base_research(**overrides) -> dict:
    """Minimal clean research result — low risk by default."""
    base = {
        "overall_risk": 0.15,
        "confidence": 0.8,
        "wilful_defaulter": False,
        "sfio_investigation": False,
        "criminal_cases": False,
        "nclt_cases": False,
        "rbi_penalties": False,
        "sebi_actions": False,
        "loan_write_off": False,
        "litigation_found": False,
        "litigation_count": 0,
        "high_court_cases": False,
        "supreme_court_cases": False,
        "litigation_risk": 0.0,
        "promoter_concerns": "",
        "litigation_details": "",
        "news_summary": "",
        "promoter_risk_flags": [],
        "mca_flags": [],
        "regulatory_actions": [],
        "circular_trading_signal": 0.0,
        "shell_company_signal": 0.0,
        "invoice_fraud_signal": 0.0,
        "loan_diversion_signal": 0.0,
        "news_sentiment": "neutral",
        "research_gaps": [],
    }
    base.update(overrides)
    return base


class TestCleanCompany:
    def test_clean_company_low_score(self):
        score = scorer.score(_base_research())
        assert 0.0 <= score <= 0.30, f"Clean company should be ≤0.30, got {score}"

    def test_returns_float(self):
        score = scorer.score(_base_research())
        assert isinstance(score, float)

    def test_breakdown_available(self):
        score, bd = scorer.score_with_breakdown(_base_research())
        assert isinstance(bd, ScoringBreakdown)
        assert bd.final_score == score
        assert len(bd.triggered_flags) == 0


class TestHardFloors:
    def test_wilful_defaulter_floor(self):
        score, bd = scorer.score_with_breakdown(
            _base_research(wilful_defaulter=True)
        )
        assert score >= 0.85, f"Wilful defaulter floor is 0.85, got {score}"
        assert "WILFUL_DEFAULTER" in bd.triggered_flags

    def test_sfio_floor(self):
        score, bd = scorer.score_with_breakdown(
            _base_research(sfio_investigation=True)
        )
        assert score >= 0.80
        assert "SFIO_INVESTIGATION" in bd.triggered_flags

    def test_criminal_floor(self):
        score = scorer.score(_base_research(criminal_cases=True))
        assert score >= 0.75

    def test_nclt_floor(self):
        score = scorer.score(_base_research(nclt_cases=True))
        assert score >= 0.65

    def test_rbi_penalty_floor(self):
        score = scorer.score(_base_research(rbi_penalties=True))
        assert score >= 0.60

    def test_sebi_floor(self):
        score = scorer.score(_base_research(sebi_actions=True))
        assert score >= 0.60

    def test_loan_writeoff_floor(self):
        score = scorer.score(_base_research(loan_write_off=True))
        assert score >= 0.55

    def test_multiple_floors_take_max(self):
        """If both SFIO and criminal are set, the higher floor (SFIO=0.80) wins."""
        score, bd = scorer.score_with_breakdown(
            _base_research(sfio_investigation=True, criminal_cases=True)
        )
        assert bd.applied_floor == 0.80
        assert score >= 0.80


class TestAdditiveLitigationDelta:
    def test_litigation_found_adds_delta(self):
        clean = scorer.score(_base_research())
        lit = scorer.score(_base_research(litigation_found=True))
        assert lit > clean

    def test_multiple_cases_increase_score(self):
        low = scorer.score(_base_research(litigation_found=True, litigation_count=1))
        high = scorer.score(_base_research(litigation_found=True, litigation_count=5))
        assert high >= low

    def test_supreme_court_adds_more(self):
        no_sc = scorer.score(_base_research(litigation_found=True))
        with_sc = scorer.score(
            _base_research(litigation_found=True, supreme_court_cases=True)
        )
        assert with_sc > no_sc


class TestKeywordAnalysis:
    def test_critical_keywords_flag(self):
        _, bd = scorer.score_with_breakdown(
            _base_research(promoter_concerns="promoter was arrested for fraud and money laundering")
        )
        assert any("CRITICAL_KEYWORDS" in f for f in bd.triggered_flags)

    def test_high_risk_keywords_flag(self):
        _, bd = scorer.score_with_breakdown(
            _base_research(news_summary="company has NPA and debt restructuring underway")
        )
        assert any("HIGH_RISK_KEYWORDS" in f for f in bd.triggered_flags)

    def test_keywords_increase_score(self):
        clean = scorer.score(_base_research())
        dirty = scorer.score(
            _base_research(promoter_concerns="arrested for fraud, fugitive, money laundering")
        )
        assert dirty > clean


class TestFraudSignals:
    def test_high_fraud_signal_increases_score(self):
        clean = scorer.score(_base_research())
        fraud = scorer.score(_base_research(circular_trading_signal=0.9))
        assert fraud > clean

    def test_fraud_signal_flag_triggered_above_threshold(self):
        _, bd = scorer.score_with_breakdown(
            _base_research(shell_company_signal=0.8)
        )
        assert any("FRAUD_SIGNAL" in f for f in bd.triggered_flags)


class TestResearchGaps:
    def test_many_gaps_add_penalty(self):
        clean = scorer.score(_base_research())
        gaps = scorer.score(
            _base_research(research_gaps=["gap1", "gap2", "gap3", "gap4"])
        )
        assert gaps > clean


class TestSentimentAmplifier:
    def test_critical_sentiment_amplifies(self):
        neutral = scorer.score(_base_research(overall_risk=0.5, news_sentiment="neutral"))
        critical = scorer.score(_base_research(overall_risk=0.5, news_sentiment="critical"))
        assert critical > neutral

    def test_negative_sentiment_amplifies(self):
        neutral = scorer.score(_base_research(overall_risk=0.5, news_sentiment="neutral"))
        negative = scorer.score(_base_research(overall_risk=0.5, news_sentiment="negative"))
        assert negative > neutral


class TestEdgeCases:
    def test_score_clamped_to_one(self):
        """Even with everything bad, score should not exceed 1.0."""
        score = scorer.score(_base_research(
            overall_risk=1.0,
            confidence=1.0,
            wilful_defaulter=True,
            sfio_investigation=True,
            criminal_cases=True,
            litigation_found=True,
            litigation_count=20,
            supreme_court_cases=True,
            promoter_concerns="fraud arrested money laundering fugitive",
            circular_trading_signal=1.0,
            shell_company_signal=1.0,
            news_sentiment="critical",
            research_gaps=["a", "b", "c", "d"],
        ))
        assert score <= 1.0

    def test_empty_dict(self):
        """Scorer should handle empty input gracefully."""
        score = scorer.score({})
        assert 0.0 <= score <= 1.0

    def test_confidence_pulls_toward_neutral(self):
        """Low confidence should pull score toward 0.35 neutral."""
        high_conf = scorer.score(_base_research(overall_risk=0.9, confidence=1.0))
        low_conf = scorer.score(_base_research(overall_risk=0.9, confidence=0.1))
        assert low_conf < high_conf


if __name__ == "__main__":
    import pytest
    pytest.main([__file__, "-v"])

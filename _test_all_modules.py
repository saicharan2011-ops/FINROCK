"""Comprehensive test of all CreditSense AI modules."""
import json
import networkx as nx
import pandas as pd

from creditsense_ai.parsers.gst_parser import GSTParser
from creditsense_ai.parsers.bank_parser import BankParser
from creditsense_ai.research.circular_trading import CircularTradingDetector
from creditsense_ai.research.promoter_scorer import PromoterScorer
from creditsense_ai.state_schema import FinancialRatios, CreditState
from creditsense_ai.output.cam_generator import CAMGenerator

passed = 0
failed = 0

def check(name, condition, detail=""):
    global passed, failed
    if condition:
        passed += 1
        print(f"  PASS  {name}")
    else:
        failed += 1
        print(f"  FAIL  {name} — {detail}")

print("=" * 60)
print("  CreditSense AI — Module Verification Suite")
print("=" * 60)

# 1. GST Parser
print("\n[1] GST Parser")
gp = GSTParser()
ratios, graph = gp.parse("nonexistent.json")
check("Handles missing file gracefully", ratios is not None)
check("Returns FinancialRatios", isinstance(ratios, FinancialRatios))
check("Returns DiGraph", isinstance(graph, nx.DiGraph))

# 2. Bank Parser
print("\n[2] Bank Parser")
bp = BankParser()
existing = FinancialRatios(op_margin=0.2)
new_ratios, inflows = bp.parse("test_bank.csv", existing)
check("Returns ratios", isinstance(new_ratios, FinancialRatios))
check("Returns inflows", inflows > 0, f"inflows={inflows}")
check("Computes DSCR", new_ratios.dscr is not None, f"dscr={new_ratios.dscr}")
check("Does NOT mutate input (no mutation)", existing.dscr is None, f"existing.dscr={existing.dscr}")

# 3. Circular Trading Detector
print("\n[3] Circular Trading Detector")
G = nx.DiGraph()
G.add_edge("A", "B", weight=50)
G.add_edge("B", "C", weight=52)
G.add_edge("C", "A", weight=54)
det = CircularTradingDetector()
res = det.detect(G)
check("Detects cycle in DiGraph", res["detected"] is True)
check("Confidence > 0", res["confidence"] > 0)

G2 = nx.DiGraph()
G2.add_edge("X", "Y", weight=100)
res2 = det.detect(G2)
check("No false positive on acyclic graph", res2["detected"] is False)

# Test DataFrame input
df = pd.DataFrame([
    {"source": "X1", "target": "X2", "amount": 100},
    {"source": "X2", "target": "X3", "amount": 95},
    {"source": "X3", "target": "X1", "amount": 90},
])
res3 = det.detect(df)
check("Detects cycle from DataFrame", res3["detected"] is True)

# 4. Promoter Scorer
print("\n[4] Promoter Scorer")
scorer = PromoterScorer()

# Clean company
clean = {
    "overall_risk": 0.1, "confidence": 0.9,
    "news_sentiment": "positive",
    "litigation_found": False, "litigation_risk": 0.0,
}
clean_score = scorer.score(clean)
check("Clean company low score", clean_score < 0.3, f"score={clean_score}")

# High risk company
risky = {
    "overall_risk": 0.8, "confidence": 0.9,
    "wilful_defaulter": True,
    "criminal_cases": True,
    "litigation_found": True, "litigation_risk": 0.8,
    "promoter_concerns": "fraud arrested money laundering",
    "news_sentiment": "critical",
}
risky_score, bd = scorer.score_with_breakdown(risky)
check("Risky company high score", risky_score >= 0.85, f"score={risky_score}")
check("Wilful defaulter floor applied", bd.applied_floor is not None and bd.applied_floor >= 0.85)
check("Multiple flags triggered", len(bd.triggered_flags) >= 3, f"flags={bd.triggered_flags}")

# 5. CAM Generator
print("\n[5] CAM Generator")
state = CreditState(company_name="Test Corp", loan_amount=5000000, last_recommendation="approve")
cam = CAMGenerator()
doc_bytes = cam.generate(state)
check("Generates non-empty DOCX", len(doc_bytes) > 1000, f"bytes={len(doc_bytes)}")

# 6. State Schema
print("\n[6] State Schema")
s = CreditState(company_name="Demo", loan_amount=100000)
check("Default step_count is 0", s.step_count == 0)
check("is_terminal false initially", s.is_terminal is False)
check("Default recommendation empty", s.last_recommendation == "")

# 7. Actions
print("\n[7] Actions Enum")
from creditsense_ai.env.actions import AppraisalAction
check("14 actions defined", len(AppraisalAction) == 14)
check("RECOMMEND_APPROVE is terminal", AppraisalAction.RECOMMEND_APPROVE.metadata.is_terminal)

# 8. Research Agent env var resolution
print("\n[8] Research Agent env var resolution")
import os
os.environ["GROQ_API_KEY"] = "test_key_123"
os.environ["GROQ_API_BASE_URL"] = "https://api.groq.com/openai/v1"
os.environ["GROQ_MODEL_NAME"] = "llama3-70b-8192"
from creditsense_ai.research.research_agent import _get_client
try:
    client, model = _get_client()
    check("Reads GROQ_API_KEY", True)
    check("Model is llama3-70b-8192", model == "llama3-70b-8192", f"model={model}")
except RuntimeError as e:
    check("_get_client succeeds", False, str(e))

# 9. Sector Scorer env var resolution
print("\n[9] Sector Scorer env var resolution")
from creditsense_ai.research.sector_scorer import SectorScorer
ss = SectorScorer()
check("SectorScorer reads GROQ model", ss.model == "llama3-70b-8192", f"model={ss.model}")

# 10. API module loads
print("\n[10] FastAPI API module")
try:
    from creditsense_ai.api import app
    check("API app loads", app is not None)
except Exception as e:
    check("API app loads", False, str(e))

print("\n" + "=" * 60)
print(f"  Results: {passed} passed, {failed} failed")
print("=" * 60)
if failed > 0:
    exit(1)

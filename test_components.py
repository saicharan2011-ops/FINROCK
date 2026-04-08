import os
import sys

from creditsense_ai.parsers.gst_parser import GSTParser
from creditsense_ai.parsers.bank_parser import BankParser
from creditsense_ai.research.circular_trading import CircularTradingDetector
from creditsense_ai.research.sector_scorer import SectorScorer
from creditsense_ai.output.cam_generator import CAMGenerator
from creditsense_ai.state_schema import CreditState, FinancialRatios, RiskSignals

def test():
    print("Testing parsers...")
    gst_parser = GSTParser()
    try:
        ratios, graph = gst_parser.parse("tests/data/task3_gst.json")
        print(f"GST Parser: margins={ratios.op_margin}, nodes={len(graph.nodes)}")
    except Exception as e:
        print(f"GST Parser FAILED: {e}")

    bank_parser = BankParser()
    try:
        ratios, inflows = bank_parser.parse("tests/data/task3_bank.csv", ratios)
        print(f"Bank Parser: inflows={inflows}, dscr={ratios.dscr}")
    except Exception as e:
        print(f"Bank Parser FAILED: {e}")

    print("Testing Mismatch...")
    try:
        is_mismatch = gst_parser.check_revenue_mismatch(gst_revenue=500000000, monthly_bank_inflows=inflows)
        print(f"Revenue mismatch logic: {is_mismatch}")
    except Exception as e:
         print(f"Revenue Mismatch FAILED: {e}")

    print("Testing Circular Trading...")
    try:
        detector = CircularTradingDetector()
        res = detector.detect(graph)
        print(f"Circular Trading: {res}")
    except Exception as e:
        print(f"Circular Trading FAILED: {e}")

    print("Testing SectorScorer...")
    try:
        scorer = SectorScorer()
        # Ensure we have API keys loaded
        from dotenv import load_dotenv
        load_dotenv()
        scorer = SectorScorer() # Reload to get env vars
        result = scorer.analyze_sector("Textiles and Apparel")
        print(f"Sector Score: {result}")
    except Exception as e:
        print(f"Sector Score FAILED: {e}")

    print("Testing CAM...")
    try:
        cam = CAMGenerator()
        state = CreditState()
        state.company_name = "Test"
        state.financial_ratios = ratios
        state.risk_signals.circular_trading_flag = 1.0
        output = cam.generate(state)
        print(f"CAM Bytes generated (len={len(output)})")
    except Exception as e:
        print(f"CAM FAILED: {e}")
        
    print("DONE")

if __name__ == "__main__":
    test()

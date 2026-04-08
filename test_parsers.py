import traceback
import sys
import pandas as pd

try:
    print("Testing BankParser...")
    from creditsense_ai.parsers.bank_parser import BankParser
    from creditsense_ai.state_schema import FinancialRatios
    
    # Create dummy CSV
    df = pd.DataFrame({
        "Date": ["2024-01-01", "2024-01-15", "2024-02-01", "2024-02-15"],
        "Description": ["Salary", "EMI payment", "Dividend", "Loan repayment"],
        "Debit": [0, 5000, 0, 5000],
        "Credit": [20000, 0, 10000, 0]
    })
    df.to_csv("test_bank.csv", index=False)
    
    parser = BankParser()
    ratios = FinancialRatios(op_margin=0.2)
    new_ratios, inflows = parser.parse("test_bank.csv", ratios)
    print(f"BankParser DSCR: {new_ratios.dscr}, Total Inflows: {inflows}")

    print("\nTesting CircularTradingDetector...")
    from creditsense_ai.research.circular_trading import CircularTradingDetector
    import networkx as nx
    G = nx.DiGraph()
    G.add_edge("A", "B", weight=50)
    G.add_edge("B", "C", weight=52)
    G.add_edge("C", "A", weight=54)
    detector = CircularTradingDetector()
    res = detector.detect(G)
    print(f"CircularTradingDetector Result: {res}")

    print("\nTesting PDFParser...")
    from creditsense_ai.parsers.pdf_parser import parse_pdf
    pdf_res = parse_pdf("creditsense_ai/test_data/task3_high_risk.pdf")
    print(f"PDFParser Found Keywords: {pdf_res.get('risk_keywords_found')}")
    
    print("\nALL MODULES TESTED SUCCESSFULLY!")
except Exception as e:
    print("\nERROR ENCOUNTERED:")
    traceback.print_exc(file=sys.stdout)

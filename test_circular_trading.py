import pandas as pd
import networkx as nx
from creditsense_ai.research.circular_trading import CircularTradingDetector

def test_circular_trading():
    detector = CircularTradingDetector()
    
    print("Testing with networkx.DiGraph:")
    G = nx.DiGraph()
    G.add_edge("A", "B", weight=50)
    G.add_edge("B", "C", weight=52)
    G.add_edge("C", "A", weight=54)
    res_g = detector.detect(G)
    print(res_g)
    print("-" * 50)

    print("Testing with list of dictionaries:")
    data_list = [
        {"source": "X1", "target": "X2", "amount": 100},
        {"source": "X2", "target": "X3", "amount": 95},
        {"source": "X3", "target": "X1", "amount": 90}
    ]
    res_l = detector.detect(data_list)
    print(res_l)
    print("-" * 50)
    
    print("Testing with pandas.DataFrame:")
    df = pd.DataFrame([
        {"from": "Alice", "to": "Bob", "value": 2000},
        {"from": "Bob", "to": "Charlie", "value": 2000},
        {"from": "Charlie", "to": "Alice", "value": 2000}
    ])
    res_df = detector.detect(df)
    print(res_df)
    print("-" * 50)
    
    print("Testing with no cycle:")
    df_no_cycle = pd.DataFrame([
        {"sender": "U1", "receiver": "U2", "amount": 500},
        {"sender": "U2", "receiver": "U3", "amount": 400}
    ])
    res_no_cycle = detector.detect(df_no_cycle)
    print(res_no_cycle)

if __name__ == "__main__":
    test_circular_trading()

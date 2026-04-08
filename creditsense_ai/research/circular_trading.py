import networkx as nx
import pandas as pd

class CircularTradingDetector:
    def detect(self, data) -> dict:
        """
        Detect circular trading from various input types:
        - networkx.DiGraph
        - pandas.DataFrame (needs columns: source, target, amount/weight)
        - list of dictionaries (needs keys: source, target, amount/weight)
        """
        graph = data
        
        # Convert list of dicts to DataFrame
        if isinstance(data, list):
            data = pd.DataFrame(data)
            
        # Convert DataFrame to DiGraph
        if isinstance(data, pd.DataFrame):
            graph = nx.DiGraph()
            # Try to find the right column names
            col_lower = {str(c).lower(): c for c in data.columns}
            
            src_col = col_lower.get("source") or col_lower.get("from") or col_lower.get("sender") or data.columns[0]
            dst_col = col_lower.get("target") or col_lower.get("to") or col_lower.get("receiver") or data.columns[1]
            amount_col = col_lower.get("amount") or col_lower.get("weight") or col_lower.get("value")
            
            for _, row in data.iterrows():
                src = row[src_col]
                dst = row[dst_col]
                weight = row[amount_col] if amount_col else 1.0
                
                # If edge already exists, add weights
                if graph.has_edge(src, dst):
                    graph[src][dst]["weight"] += weight
                else:
                    graph.add_edge(src, dst, weight=weight)
                    
        elif not isinstance(graph, (nx.DiGraph, nx.Graph)):
            return {"detected": False, "error": "Unsupported input type. Please provide a DiGraph, DataFrame, or list of dicts.", "cycles": [], "confidence": 0.0}

        try:
            cycles = list(nx.simple_cycles(graph))
        except nx.NetworkXNoCycle:
            cycles = []
            
        if not cycles:
            return {"detected": False, "cycles": [], "confidence": 0.0}
            
        suspicious = []
        for cycle in cycles:
            amounts = []
            for i in range(len(cycle)):
                src = cycle[i]
                dst = cycle[(i+1) % len(cycle)]
                if graph.has_edge(src, dst):
                    amounts.append(graph[src][dst].get("weight", 0))
            
            if amounts and len(amounts) > 1:
                max_amt = max(amounts)
                min_amt = min(amounts)
                is_highly_suspicious = (max_amt - min_amt) / max_amt < 0.2 if max_amt > 0 else False
                
                suspicious.append({
                    "cycle": cycle,
                    "amounts": amounts,
                    "min_amount": min_amt,
                    "max_amount": max_amt,
                    "is_highly_suspicious": is_highly_suspicious
                })
                
        highly_suspicious = [s for s in suspicious if s.get("is_highly_suspicious")]
        confidence = 1.0 if highly_suspicious else (0.8 if suspicious else 0.5)
        
        return {
            "detected": bool(suspicious),
            "cycles": [s["cycle"] for s in suspicious],
            "cycle_details": suspicious,
            "confidence": confidence
        }

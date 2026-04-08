import json
import networkx as nx
from creditsense_ai.state_schema import FinancialRatios

class GSTParser:
    def parse(self, filepath: str):
        try:
            with open(filepath, 'r') as f:
                data = json.load(f)
        except Exception:
            data = {}
        ratios = FinancialRatios()
        ratios.op_margin = self._calc_margin(data)
        invoice_graph = self._build_invoice_graph(data)
        return ratios, invoice_graph

    def _calc_margin(self, data):
        revenue = data.get("total_revenue", 0)
        tax = data.get("total_tax_paid", 0)
        itc = data.get("input_tax_credit", 0)
        if revenue == 0: return None
        net_tax = tax - itc
        return round((revenue - net_tax) / revenue, 4)

    def _build_invoice_graph(self, data):
        G = nx.DiGraph()
        for inv in data.get("b2b_invoices", []):
            seller = data.get("gstin")
            buyer = inv.get("buyer_gstin")
            amount = inv.get("taxable_value", 0)
            G.add_edge(seller, buyer, weight=amount)
        return G

    def check_revenue_mismatch(self, gst_revenue: float, monthly_bank_inflows: float) -> bool:
        if monthly_bank_inflows <= 0:
            return False
        annual_bank = monthly_bank_inflows * 12
        
        ratio = max(gst_revenue, annual_bank) / min(gst_revenue, annual_bank) if min(gst_revenue, annual_bank) > 0 else 0
        return ratio > 1.5

import pandas as pd
from creditsense_ai.state_schema import FinancialRatios

class BankParser:
    def parse(self, filepath: str, existing_ratios: FinancialRatios = None):
        if existing_ratios is None:
            existing_ratios = FinancialRatios()
            
        try:
            df = pd.read_csv(filepath)
        except Exception:
            # Fallback if file doesn't exist or not valid CSV
            return existing_ratios, 0.0

        df.columns = [c.strip().lower() for c in df.columns]
        
        total_inflows = 0.0
        if "credit" in df.columns:
            total_inflows = float(df["credit"].sum())
        elif "deposit" in df.columns:
            total_inflows = float(df["deposit"].sum())
            
        total_emi = 0.0
        if "description" in df.columns:
            if "debit" in df.columns:
                total_emi = df[df["description"].str.contains("EMI|Loan", case=False, na=False)]["debit"].sum()
            elif "withdrawal" in df.columns:
                total_emi = df[df["description"].str.contains("EMI|Loan", case=False, na=False)]["withdrawal"].sum()
            
        if "date" in df.columns and total_emi > 0:
            unique_months = len(df["date"].astype(str).str[:7].unique())
            unique_months = max(1, unique_months)
            monthly_emi = total_emi / unique_months
            annual_emi = monthly_emi * 12
            
            if existing_ratios.op_margin and total_inflows > 0:
                net_income = total_inflows * existing_ratios.op_margin
                existing_ratios.dscr = round(net_income / annual_emi, 4) if annual_emi else None
                
        return existing_ratios, total_inflows

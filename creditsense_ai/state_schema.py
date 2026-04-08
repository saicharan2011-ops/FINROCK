from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class BlockchainAudit(BaseModel):
    tx_hash: str
    block_number: int
    state_root_hash: str

class FinancialRatios(BaseModel):
    dscr: Optional[float] = None           # Debt Service Coverage Ratio
    de_ratio: Optional[float] = None       # Debt to Equity
    current_ratio: Optional[float] = None  # Current Assets / Current Liabilities
    interest_coverage: Optional[float] = None
    op_margin: Optional[float] = None      # Operating Margin
    revenue_mismatch_flag: bool = False    # GST vs bank statement mismatch

class DocCompleteness(BaseModel):
    gst: bool = False
    itr: bool = False
    bank_stmt: bool = False
    annual_report: bool = False
    mca: bool = False

class RiskSignals(BaseModel):
    litigation_risk: float = 0.0      # 0.0 = no risk, 1.0 = high risk
    promoter_risk: float = 0.0
    circular_trading_flag: float = 0.0
    sector_headwind: float = 0.0
    tamper_detected: bool = False

class CreditState(BaseModel):
    financial_ratios: FinancialRatios = FinancialRatios()
    doc_completeness: DocCompleteness = DocCompleteness()
    risk_signals: RiskSignals = RiskSignals()
    research_summary: str = ""
    primary_insight_score: float = 0.0
    last_recommendation: str = ""        # "approve", "reject", "partial", ""
    step_count: int = 0
    company_name: str = ""
    
    # Internal RL and Audit Tracking fields
    loan_amount: float = 0.0
    doc_completeness_pct: float = 0.0
    total_reward: float = 0.0
    parsed_data: Dict[str, Any] = Field(default_factory=dict)
    turbo_metadata: Optional[str] = None
    audit_trail: List[BlockchainAudit] = []
    
    @property
    def is_terminal(self) -> bool:
        docs_present = (
            self.doc_completeness.gst and
            self.doc_completeness.itr and
            self.doc_completeness.bank_stmt and
            self.doc_completeness.annual_report and
            self.doc_completeness.mca
        )
        return bool(docs_present and self.step_count > 10)

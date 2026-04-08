from enum import IntEnum
from dataclasses import dataclass
from typing import Tuple

@dataclass(frozen=True)
class ActionMetadata:
    target_obj: str
    target_field: str
    is_terminal: bool

class AppraisalAction(IntEnum):
    REQUEST_GST = 0
    REQUEST_ITR = 1
    REQUEST_BANK_STMT = 2
    REQUEST_ANNUAL_REPORT = 3
    REQUEST_MCA_FILING = 4
    
    RUN_CIRCULAR_TRADING_CHECK = 5
    RUN_LITIGATION_SEARCH = 6
    RUN_PROMOTER_NEWS_SEARCH = 7
    RUN_SECTOR_RESEARCH = 8
    
    INPUT_SITE_VISIT = 9
    INPUT_MGMT_INTERVIEW = 10
    
    RECOMMEND_APPROVE = 11
    RECOMMEND_REJECT = 12
    RECOMMEND_PARTIAL = 13

    @property
    def metadata(self) -> ActionMetadata:
        return _ACTION_META[self]

_ACTION_META = {
    AppraisalAction.REQUEST_GST: ActionMetadata("doc_completeness", "gst", False),
    AppraisalAction.REQUEST_ITR: ActionMetadata("doc_completeness", "itr", False),
    AppraisalAction.REQUEST_BANK_STMT: ActionMetadata("doc_completeness", "bank_stmt", False),
    AppraisalAction.REQUEST_ANNUAL_REPORT: ActionMetadata("doc_completeness", "annual_report", False),
    AppraisalAction.REQUEST_MCA_FILING: ActionMetadata("doc_completeness", "mca", False),

    AppraisalAction.RUN_CIRCULAR_TRADING_CHECK: ActionMetadata("risk_signals", "circular_trading_flag", False),
    AppraisalAction.RUN_LITIGATION_SEARCH: ActionMetadata("risk_signals", "litigation_risk", False),
    AppraisalAction.RUN_PROMOTER_NEWS_SEARCH: ActionMetadata("risk_signals", "promoter_risk", False),
    AppraisalAction.RUN_SECTOR_RESEARCH: ActionMetadata("risk_signals", "sector_headwind", False),

    AppraisalAction.INPUT_SITE_VISIT: ActionMetadata("", "research_summary", False),
    AppraisalAction.INPUT_MGMT_INTERVIEW: ActionMetadata("", "research_summary", False),

    AppraisalAction.RECOMMEND_APPROVE: ActionMetadata("", "", True),
    AppraisalAction.RECOMMEND_REJECT: ActionMetadata("", "", True),
    AppraisalAction.RECOMMEND_PARTIAL: ActionMetadata("", "", True),
}

import gymnasium as gym
from gymnasium import spaces
import numpy as np
from typing import Any, Dict, Tuple
import random as _random
import threading
import sys
import os

try:
    from ..blockchain.web3_logger import BlockchainLogger as CreditAuditLogger
except ImportError:
    CreditAuditLogger = None

class MockParser:
    def parse(self, file_path): return {"parsed": True}
class MockResearchAgent:
    def detect_cycles(self, parsed_data): return True
    def synthesize_site_visit(self, notes): return 8.0
class MockCAM:
    def generate(self, state): return True

try:
    from ..parsers.gst_parser import GSTParser
except ImportError:
    GSTParser = MockParser

try:
    from ..parsers.bank_parser import BankParser
except ImportError:
    BankParser = MockParser

try:
    from ..research.research_agent import ResearchAgent
except ImportError:
    ResearchAgent = MockResearchAgent

try:
    from ..output.cam_generator import CAMGenerator
except ImportError:
    CAMGenerator = MockCAM

try:
    from ..research.promoter_scorer import PromoterScorer
except ImportError:
    PromoterScorer = None



from ..state_schema import (
    FinancialRatios,
    RiskSignals,
    DocCompleteness,
    BlockchainAudit,
    CreditState
)
from .actions import AppraisalAction

class TurboQuant:
    @staticmethod
    def extract_critical_signals(state: CreditState) -> np.ndarray:
        return np.array([
            state.doc_completeness_pct,
            float(state.step_count),
            state.financial_ratios.dscr if state.financial_ratios.dscr is not None else 0.0,
            state.financial_ratios.de_ratio if state.financial_ratios.de_ratio is not None else 0.0,
            state.financial_ratios.current_ratio if state.financial_ratios.current_ratio is not None else 0.0,
            state.financial_ratios.interest_coverage if state.financial_ratios.interest_coverage is not None else 0.0,
            state.financial_ratios.op_margin if state.financial_ratios.op_margin is not None else 0.0,
            state.risk_signals.circular_trading_flag,
            state.risk_signals.promoter_risk,
            state.risk_signals.litigation_risk,
            float(state.financial_ratios.revenue_mismatch_flag),
            state.risk_signals.sector_headwind,
            float(state.doc_completeness.gst),
            float(state.doc_completeness.itr),
            float(state.doc_completeness.bank_stmt),
            float(state.doc_completeness.annual_report),
            float(state.doc_completeness.mca)
        ], dtype=np.float32)

    @staticmethod
    def compress_state_to_hash(state: CreditState) -> bytes:
        import hashlib
        signals = TurboQuant.extract_critical_signals(state)
        # Create deterministic CSV representation (4 decimals) matched to Solidity
        deterministic_repr = ",".join([f"{float(v):.4f}" for v in signals])
        return hashlib.sha256(deterministic_repr.encode("utf-8")).digest()

class CreditAppraisalEnv(gym.Env):
    def __init__(self, task_config: Dict[str, Any] = None) -> None:
        super().__init__()
        
        self.task_config = task_config or {}
        self.action_space = spaces.Discrete(14)
        
        self.blockchain_enabled = str(os.environ.get("BLOCKCHAIN_ENABLED", "false")).lower() == "true"
        self.audit_logger = None
        if self.blockchain_enabled and CreditAuditLogger is not None:
            try:
                self.audit_logger = CreditAuditLogger()
                if not hasattr(self.audit_logger, 'log_action_to_blockchain'):
                    self.audit_logger.log_action_to_blockchain = lambda loan_id, action, state_hash: self.audit_logger.log_action(
                        loan_id, getattr(self.state, "step_count", 0), action, state_hash
                    )
            except Exception as e:
                print(f"Failed to initialize blockchain logger: {e}", file=sys.stderr)
                self.blockchain_enabled = False
        
        self.gst_parser = GSTParser()
        self.bank_parser = BankParser()
        self.research_agent = ResearchAgent()
        self.cam_generator = CAMGenerator()
        
        low = np.array([0.0]*17, dtype=np.float32)
        low[6] = -1.0 # op_margin can be negative
        high = np.array([100.0, 20.0, 10.0, 10.0, 10.0, 20.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0], dtype=np.float32)

        self.observation_space = spaces.Box(low=low, high=high, dtype=np.float32)
        
        self.state: CreditState = self._initialize_state()
        self.loan_id = self.task_config.get("company_name", "UNKNOWN_COMPANY")

    def _initialize_state(self) -> CreditState:
        return CreditState(
            company_name=self.task_config.get("company_name", ""),
            loan_amount=float(self.task_config.get("loan_amount", 0.0)),
            doc_completeness_pct=0.0,
            step_count=0,
            total_reward=0.0,
            financial_ratios=FinancialRatios(
                dscr=float(self.task_config.get("dscr", 0.0)),
                de_ratio=float(self.task_config.get("debt_equity_ratio", 0.0)),
                current_ratio=float(self.task_config.get("current_ratio", 0.0)),
                interest_coverage=float(self.task_config.get("interest_coverage", 0.0)),
                op_margin=float(self.task_config.get("operating_margin", 0.0)),
                revenue_mismatch_flag=False
            ),
            risk_signals=RiskSignals(
                litigation_risk=0.0,
                promoter_risk=0.0,
                circular_trading_flag=0.0,
                sector_headwind=0.0,
                tamper_detected=False
            ),
            doc_completeness=DocCompleteness(
                gst=False,
                itr=False,
                bank_stmt=False,
                annual_report=False,
                mca=False
            ),
            research_summary="",
            primary_insight_score=0.0,
            last_recommendation="",
            turbo_metadata=None,
            audit_trail=[]
        )

    def reset(self, seed: int = None, options: Dict[str, Any] = None) -> Tuple[np.ndarray, Dict[str, Any]]:
        super().reset(seed=seed)
        if seed is not None:
            np.random.seed(seed)
            _random.seed(seed)
        self.state = self._initialize_state()
        self.state.parsed_data = {}
        return self._get_observation(), {}

    def _score_recommendation(self, action_enum: AppraisalAction) -> float:
        reward = 0.0
        
        # 5. Premature Decision Option: -0.30 penalty if doc completeness < 60%
        if self.state.doc_completeness_pct < 60.0:
            reward -= 0.30
            
        # 6. Correct Recommendation
        gt_decision = self.task_config.get("decision", self.task_config.get("ground_truth_label", ""))
        agent_decision = {
            AppraisalAction.RECOMMEND_APPROVE: "APPROVE",
            AppraisalAction.RECOMMEND_REJECT: "REJECT",
            AppraisalAction.RECOMMEND_PARTIAL: "PARTIAL"
        }.get(action_enum, "")
        
        if agent_decision and agent_decision == gt_decision:
            reward += 1.0
        elif agent_decision and agent_decision != gt_decision:
            reward += 0.0 # explicit constraint 6 for wrong mismatch (could also be -1.0)
            
        # 7. Missed Risk Penalty: -0.25 if detectable risk exists in config but agent never ran check
        has_litigation = self.task_config.get("has_litigation", False) or float(self.task_config.get("ground_truth", {}).get("litigation_risk", 0.0)) > 0.5
        if has_litigation and self.state.risk_signals.litigation_risk <= 0.5:
            reward -= 0.25
            
        return reward

    def step(self, action: int) -> Tuple[np.ndarray, float, bool, bool, Dict[str, Any]]:
        self.state = self.state.model_copy(
            update={"step_count": self.state.step_count + 1}, deep=True
        )
        prev_state = self.state.model_copy(deep=True)
        
        info = {}
        action_enum = AppraisalAction(action)
        file_path = self.task_config.get("document_path", "dummy.pdf")
        
        if not hasattr(self.state, "parsed_data"):
            self.state.parsed_data = {}

        try:
            if action_enum == AppraisalAction.REQUEST_GST:
                parsed_data = self.gst_parser.parse(file_path)
                self.state.parsed_data["gst"] = parsed_data
                self.state = self.state.model_copy(
                    update={
                        "doc_completeness": self.state.doc_completeness.model_copy(update={"gst": True}),
                        "doc_completeness_pct": min(self.state.doc_completeness_pct + 20.0, 100.0)
                    }, deep=True
                )
                
            elif action_enum == AppraisalAction.REQUEST_BANK_STMT:
                parsed_data = self.bank_parser.parse(file_path)
                self.state.parsed_data["bank_stmt"] = parsed_data
                self.state = self.state.model_copy(
                    update={
                        "doc_completeness": self.state.doc_completeness.model_copy(update={"bank_stmt": True}),
                        "doc_completeness_pct": min(self.state.doc_completeness_pct + 20.0, 100.0)
                    }, deep=True
                )
                
            elif action_enum == AppraisalAction.REQUEST_ITR:
                self.state = self.state.model_copy(
                    update={
                        "doc_completeness": self.state.doc_completeness.model_copy(update={"itr": True}),
                        "doc_completeness_pct": min(self.state.doc_completeness_pct + 20.0, 100.0)
                    }, deep=True
                )
                
            elif action_enum == AppraisalAction.REQUEST_ANNUAL_REPORT:
                self.state = self.state.model_copy(
                    update={
                        "doc_completeness": self.state.doc_completeness.model_copy(update={"annual_report": True}),
                        "doc_completeness_pct": min(self.state.doc_completeness_pct + 20.0, 100.0)
                    }, deep=True
                )
                
            elif action_enum == AppraisalAction.REQUEST_MCA_FILING:
                self.state = self.state.model_copy(
                    update={
                        "doc_completeness": self.state.doc_completeness.model_copy(update={"mca": True}),
                        "doc_completeness_pct": min(self.state.doc_completeness_pct + 20.0, 100.0)
                    }, deep=True
                )

            elif action_enum == AppraisalAction.RUN_CIRCULAR_TRADING_CHECK:
                cycle_found = self.research_agent.detect_cycles(self.state.parsed_data)
                self.state = self.state.model_copy(
                    update={
                        "risk_signals": self.state.risk_signals.model_copy(update={"circular_trading_flag": float(cycle_found)})
                    }, deep=True
                )
                
            elif action_enum == AppraisalAction.RUN_LITIGATION_SEARCH:
                # Simulate detection for test cases by reading from config overrides
                lit_risk_val = float(self.task_config.get("mock_litigation_risk", 0.0))
                self.state = self.state.model_copy(
                    update={"risk_signals": self.state.risk_signals.model_copy(update={"litigation_risk": lit_risk_val})}, deep=True
                )
                
            elif action_enum == AppraisalAction.RUN_PROMOTER_NEWS_SEARCH:
                # Try calibrated scoring via PromoterScorer if research data exists
                research_data = self.task_config.get("research_data")
                if research_data and PromoterScorer is not None:
                    scorer = PromoterScorer()
                    promo_risk_val = scorer.score(research_data)
                else:
                    promo_risk_val = float(self.task_config.get("mock_promoter_risk", 0.0))
                self.state = self.state.model_copy(
                    update={"risk_signals": self.state.risk_signals.model_copy(update={"promoter_risk": promo_risk_val})}, deep=True
                )
                
            elif action_enum == AppraisalAction.RUN_SECTOR_RESEARCH:
                self.state = self.state.model_copy(
                    update={"risk_signals": self.state.risk_signals.model_copy(update={"sector_headwind": 1.0})}, deep=True
                )

            elif action_enum in [AppraisalAction.INPUT_SITE_VISIT, AppraisalAction.INPUT_MGMT_INTERVIEW]:
                notes = "visit complete" if action_enum == AppraisalAction.INPUT_SITE_VISIT else "interview complete"
                score = self.research_agent.synthesize_site_visit(notes) if hasattr(self.research_agent, 'synthesize_site_visit') else 8.0
                self.state = self.state.model_copy(
                    update={
                        "research_summary": notes,
                        "primary_insight_score": score
                    }, deep=True
                )

            elif action_enum in [AppraisalAction.RECOMMEND_APPROVE, AppraisalAction.RECOMMEND_REJECT, AppraisalAction.RECOMMEND_PARTIAL]:
                if hasattr(self.cam_generator, "generate"):
                    self.cam_generator.generate(self.state)

            state_hash = TurboQuant.compress_state_to_hash(self.state)
            if self.audit_logger and hasattr(self.audit_logger, "log_action_to_blockchain"):
                def run_web3_call():
                    try:
                        self.audit_logger.log_action_to_blockchain(self.loan_id, action, state_hash)
                    except Exception as e:
                        print(f"Blockchain logging failed: {e}", file=sys.stderr)
                t = threading.Thread(target=run_web3_call)
                t.daemon = True
                t.start()

        except Exception as e:
            info["warning"] = f"Module execution failed: {str(e)}"

        terminated = action_enum in [
            AppraisalAction.RECOMMEND_APPROVE,
            AppraisalAction.RECOMMEND_REJECT,
            AppraisalAction.RECOMMEND_PARTIAL
        ]
        truncated = self.state.step_count >= 20
        done = terminated or truncated

        # --- 8 Reward Signals Implementation ---
        reward = 0.0
        
        # 8. Step Penalty: A default -0.01 for every non-terminal action
        if not terminated:
            reward -= 0.01

        # 1. Redundant Doc Penalty
        if action_enum == AppraisalAction.REQUEST_GST and prev_state.doc_completeness.gst:
            reward -= 0.05
        elif action_enum == AppraisalAction.REQUEST_ITR and prev_state.doc_completeness.itr:
            reward -= 0.05
        elif action_enum == AppraisalAction.REQUEST_BANK_STMT and prev_state.doc_completeness.bank_stmt:
            reward -= 0.05
        elif action_enum == AppraisalAction.REQUEST_ANNUAL_REPORT and prev_state.doc_completeness.annual_report:
            reward -= 0.05
        elif action_enum == AppraisalAction.REQUEST_MCA_FILING and prev_state.doc_completeness.mca:
            reward -= 0.05

        # 2. Circular Discovery
        if action_enum == AppraisalAction.RUN_CIRCULAR_TRADING_CHECK:
            if self.state.risk_signals.circular_trading_flag > 0.0 and prev_state.risk_signals.circular_trading_flag == 0.0:
                reward += 0.20

        # 3. Litigation Discovery
        if action_enum == AppraisalAction.RUN_LITIGATION_SEARCH:
            if self.state.risk_signals.litigation_risk > 0.5 and prev_state.risk_signals.litigation_risk <= 0.5:
                reward += 0.15

        # 4. Promoter Discovery
        if action_enum == AppraisalAction.RUN_PROMOTER_NEWS_SEARCH:
            if self.state.risk_signals.promoter_risk > 0.5 and prev_state.risk_signals.promoter_risk <= 0.5:
                reward += 0.15

        # Terminal Scoring
        if terminated:
            reward += self._score_recommendation(action_enum)

        self.state = self.state.model_copy(
            update={"total_reward": self.state.total_reward + reward}, deep=True
        )
        
        if self.blockchain_enabled and "warning" not in info:
            info["pending_blockchain_sync"] = True

        return self._get_observation(), float(reward), terminated, truncated, info

    def _get_observation(self) -> np.ndarray:
        return TurboQuant.extract_critical_signals(self.state)

    def get_state(self) -> CreditState:
        return self.state

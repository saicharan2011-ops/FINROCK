from typing import Any
from ..state_schema import CreditState
from .actions import AppraisalAction

STEP_COSTS = {
    # Document collection
    0: -0.01, 1: -0.01, 2: -0.01, 3: -0.01, 4: -0.01,
    # Research / deep-dive
    5: -0.05, 6: -0.05, 7: -0.05, 8: -0.05,
    # Qualitative input
    9: -0.02, 10: -0.02,
    # Terminal — base cost is 0, outcome reward applied separately
    11: 0.0, 12: 0.0, 13: 0.0,
}

def calculate_reward(action: int, prev_state: CreditState, new_state: CreditState, ground_truth: dict, done: bool) -> float:
    act = AppraisalAction(action)
    meta = act.metadata

    if done:
        if act in (AppraisalAction.RECOMMEND_APPROVE, AppraisalAction.RECOMMEND_REJECT, AppraisalAction.RECOMMEND_PARTIAL):
            if new_state.doc_completeness_pct < 60.0:
                return -0.30
                
            decision_map = {
                AppraisalAction.RECOMMEND_APPROVE: "APPROVE",
                AppraisalAction.RECOMMEND_REJECT: "REJECT",
                AppraisalAction.RECOMMEND_PARTIAL: "PARTIAL"
            }
            agent_decision = decision_map[act]
            if agent_decision == ground_truth.get('decision'):
                return 1.0
            return -1.0
        return 0.0

    if meta.target_obj == "doc_completeness":
        if getattr(prev_state.doc_completeness, meta.target_field) is True:
            # Option A: flat -0.05 (includes base cost) because simpler reward functions train faster
            return -0.05

    reward = STEP_COSTS.get(action, -0.01)

    if act == AppraisalAction.RUN_CIRCULAR_TRADING_CHECK:
        if new_state.risk_signals.circular_trading_flag and not prev_state.risk_signals.circular_trading_flag:
            reward += 0.20

    for flag in ["promoter_risk", "litigation_risk", "sector_headwind"]:
        old_val = getattr(prev_state.risk_signals, flag)
        new_val = getattr(new_state.risk_signals, flag)
        if old_val <= 0.5 and new_val > 0.5:
            reward += 0.15

    if new_state.financial_ratios.revenue_mismatch_flag and not prev_state.financial_ratios.revenue_mismatch_flag:
        reward += 0.10
        
    return reward

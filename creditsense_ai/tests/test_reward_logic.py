import unittest
from creditsense_ai.env.reward_logic import calculate_reward
from creditsense_ai.state_schema import CreditState, FinancialRatios, RiskSignals, DocCompleteness
from creditsense_ai.env.actions import AppraisalAction

class TestRewardLogic(unittest.TestCase):
    def setUp(self):
        self.base_state = CreditState(
            company_name="TestCorp",
            loan_amount=1000.0,
            doc_completeness_pct=0.0,
            step_count=0,
            total_reward=0.0,
            financial_ratios=FinancialRatios(dscr=1.0, de_ratio=1.0, current_ratio=1.0, interest_coverage=1.0, op_margin=1.0),
            risk_signals=RiskSignals(circular_trading_flag=0.0, promoter_risk=0.0, litigation_risk=0.0, sector_headwind=0.0),
            doc_completeness=DocCompleteness(gst=False, itr=False, bank_stmt=False, annual_report=False, mca=False),
            turbo_metadata=None
        )
        self.ground_truth = {"decision": "APPROVE"}

    def test_redundant_document_request(self):
        prev_state = self.base_state.model_copy(
            update={
                "doc_completeness": self.base_state.doc_completeness.model_copy(
                    update={"gst": True}
                )
            },
            deep=True
        )
        new_state = prev_state.model_copy(deep=True)
        
        reward = calculate_reward(int(AppraisalAction.REQUEST_GST), prev_state, new_state, self.ground_truth, False)
        self.assertEqual(reward, -0.05)

    def test_terminal_recommendation_insufficient_data(self):
        prev_state = self.base_state.model_copy(deep=True)
        new_state = prev_state.model_copy(
            update={"doc_completeness_pct": 40.0},
            deep=True
        )
        
        reward = calculate_reward(int(AppraisalAction.RECOMMEND_APPROVE), prev_state, new_state, self.ground_truth, True)
        self.assertEqual(reward, -0.30)

    def test_correct_final_decision(self):
        prev_state = self.base_state.model_copy(deep=True)
        new_state = prev_state.model_copy(
            update={"doc_completeness_pct": 80.0},
            deep=True
        )
        
        reward = calculate_reward(int(AppraisalAction.RECOMMEND_APPROVE), prev_state, new_state, self.ground_truth, True)
        self.assertEqual(reward, 1.0)

    def test_incorrect_final_decision(self):
        prev_state = self.base_state.model_copy(deep=True)
        new_state = prev_state.model_copy(
            update={"doc_completeness_pct": 80.0},
            deep=True
        )
        
        reward = calculate_reward(int(AppraisalAction.RECOMMEND_REJECT), prev_state, new_state, self.ground_truth, True)
        self.assertEqual(reward, -1.0)

    def test_successful_circular_trading_detection(self):
        prev_state = self.base_state.model_copy(deep=True)
        new_state = prev_state.model_copy(
            update={
                "risk_signals": prev_state.risk_signals.model_copy(
                    update={"circular_trading_flag": 1.0}
                )
            },
            deep=True
        )
        
        reward = calculate_reward(int(AppraisalAction.RUN_CIRCULAR_TRADING_CHECK), prev_state, new_state, self.ground_truth, False)
        self.assertAlmostEqual(reward, 0.15)

    def test_litigation_risk_detection(self):
        prev_state = self.base_state.model_copy(deep=True)
        new_state = prev_state.model_copy(
            update={"risk_signals": prev_state.risk_signals.model_copy(
                update={"litigation_risk": 0.9}
            )}, deep=True
        )
        reward = calculate_reward(
            int(AppraisalAction.RUN_LITIGATION_SEARCH),
            prev_state, new_state, self.ground_truth, False
        )
        self.assertAlmostEqual(reward, 0.10)

    def test_promoter_risk_detection(self):
        prev_state = self.base_state.model_copy(deep=True)
        new_state = prev_state.model_copy(
            update={"risk_signals": prev_state.risk_signals.model_copy(
                update={"promoter_risk": 0.8}
            )}, deep=True
        )
        reward = calculate_reward(
            int(AppraisalAction.RUN_PROMOTER_NEWS_SEARCH),
            prev_state, new_state, self.ground_truth, False
        )
        self.assertAlmostEqual(reward, 0.10)

    def test_normal_investigative_step_penalty(self):
        prev_state = self.base_state.model_copy(deep=True)
        new_state = prev_state.model_copy(deep=True)
        
        reward = calculate_reward(int(AppraisalAction.INPUT_SITE_VISIT), prev_state, new_state, self.ground_truth, False)
        self.assertEqual(reward, -0.02)

    def test_premature_decision_zero_docs(self):
        prev_state = self.base_state.model_copy(deep=True)
        new_state = prev_state.model_copy(deep=True)
        reward = calculate_reward(
            int(AppraisalAction.RECOMMEND_REJECT),
            prev_state, new_state, self.ground_truth, True
        )
        self.assertEqual(reward, -0.30)

    def test_correct_decision_exactly_at_60pct_threshold(self):
        prev_state = self.base_state.model_copy(deep=True)
        new_state = prev_state.model_copy(
            update={"doc_completeness_pct": 60.0}, deep=True
        )
        reward = calculate_reward(
            int(AppraisalAction.RECOMMEND_APPROVE),
            prev_state, new_state, self.ground_truth, True
        )
        self.assertEqual(reward, 1.0)

    def test_correct_decision_at_59pct_triggers_penalty(self):
        prev_state = self.base_state.model_copy(deep=True)
        new_state = prev_state.model_copy(
            update={"doc_completeness_pct": 59.0}, deep=True
        )
        reward = calculate_reward(
            int(AppraisalAction.RECOMMEND_APPROVE),
            prev_state, new_state, self.ground_truth, True
        )
        self.assertEqual(reward, -0.30)

    def test_revenue_mismatch_detection(self):
        prev_state = self.base_state.model_copy(deep=True)
        new_state = prev_state.model_copy(
            update={"financial_ratios": prev_state.financial_ratios.model_copy(
                update={"revenue_mismatch_flag": True}
            )}, deep=True
        )
        reward = calculate_reward(
            int(AppraisalAction.RUN_CIRCULAR_TRADING_CHECK),
            prev_state, new_state, self.ground_truth, False
        )
        self.assertAlmostEqual(reward, 0.05)

    def test_reward_not_awarded_for_pre_existing_risk_flag(self):
        prev_state = self.base_state.model_copy(
            update={"risk_signals": self.base_state.risk_signals.model_copy(
                update={"circular_trading_flag": 1.0}
            )}, deep=True
        )
        new_state = prev_state.model_copy(deep=True)
        reward = calculate_reward(
            int(AppraisalAction.RUN_CIRCULAR_TRADING_CHECK),
            prev_state, new_state, self.ground_truth, False
        )
        self.assertLessEqual(reward, 0.0)

if __name__ == '__main__':
    unittest.main()

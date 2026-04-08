import pytest
from creditsense_ai.env.CreditAppraisalEnv import CreditAppraisalEnv
from creditsense_ai.env.actions import AppraisalAction

@pytest.fixture
def base_config():
    return {
        "company_name": "Testbed Corp",
        "decision": "REJECT",
        "has_litigation": False,
        "mock_litigation_risk": 0.0,
        "mock_promoter_risk": 0.0,
        "document_path": "dummy.pdf"
    }

def test_step_cost(base_config):
    # 9. Verify -0.01 penalty on a standard investigative action.
    env = CreditAppraisalEnv(base_config)
    env.reset()
    _, reward, _, _, _ = env.step(AppraisalAction.REQUEST_GST)
    assert reward == -0.01

def test_redundant_doc_penalty(base_config):
    # 1. Verify -0.05 on second request of GST (plus the -0.01 default = -0.06)
    env = CreditAppraisalEnv(base_config)
    env.reset()
    env.step(AppraisalAction.REQUEST_GST) # First request = -0.01
    _, reward, _, _, _ = env.step(AppraisalAction.REQUEST_GST) # Second request
    assert round(reward, 2) == -0.06

def test_circular_detection_reward(base_config):
    # 2. Mock _run_circular_check to return True, verify +0.20 (+0.19 with step penalty)
    env = CreditAppraisalEnv(base_config)
    env.reset()
    # Mock ResearchAgent response inline since env sets state dynamically
    env.research_agent.detect_cycles = lambda x: 1.0 
    _, reward, _, _, _ = env.step(AppraisalAction.RUN_CIRCULAR_TRADING_CHECK)
    assert round(reward, 2) == 0.19

def test_litigation_detection_reward(base_config):
    # 3. Mock litigation risk > 0.5, verify +0.15 (+0.14 with step penalty)
    config = base_config.copy()
    config["mock_litigation_risk"] = 0.8
    env = CreditAppraisalEnv(config)
    env.reset()
    _, reward, _, _, _ = env.step(AppraisalAction.RUN_LITIGATION_SEARCH)
    assert round(reward, 2) == 0.14

def test_premature_recommendation_penalty(base_config):
    # 4. Recommend with 0 docs, verify -0.30 deduction.
    env = CreditAppraisalEnv(base_config)
    env.reset()
    # Incorrect recommendation ("APPROVE" vs gt "REJECT"), 0 docs
    _, reward, terminated, _, _ = env.step(AppraisalAction.RECOMMEND_APPROVE)
    assert terminated is True
    # Base 0 + premature (-0.30) + wrong (0.0) = -0.30
    assert reward == -0.30

def test_correct_recommendation(base_config):
    # 5. Match ground truth, verify +1.0
    env = CreditAppraisalEnv(base_config)
    env.reset()
    # Trick the env to bypass premature penalty
    env.state.doc_completeness_pct = 100.0
    _, reward, terminated, _, _ = env.step(AppraisalAction.RECOMMEND_REJECT)
    assert terminated is True
    assert reward == 1.0

def test_wrong_recommendation(base_config):
    # 6. Mismatch ground truth, verify 0.0 or negative reward.
    env = CreditAppraisalEnv(base_config)
    env.reset()
    env.state.doc_completeness_pct = 100.0
    _, reward, terminated, _, _ = env.step(AppraisalAction.RECOMMEND_APPROVE)
    assert terminated is True
    assert reward == 0.0

def test_missed_litigation_penalty(base_config):
    # 7. Set has_litigation=True in config, don't run check, verify -0.25 (when doing terminal step)
    config = base_config.copy()
    config["has_litigation"] = True
    env = CreditAppraisalEnv(config)
    env.reset()
    env.state.doc_completeness_pct = 100.0
    # Make a wrong recommendation so base reward is 0.0, to isolate the -0.25 penalty
    _, reward, terminated, _, _ = env.step(AppraisalAction.RECOMMEND_APPROVE)
    assert terminated is True
    assert reward == -0.25

def test_max_steps_termination(base_config):
    # 8. Take 20 actions, verify done=True
    env = CreditAppraisalEnv(base_config)
    env.reset()
    for _ in range(19):
        _, _, terminated, truncated, _ = env.step(AppraisalAction.REQUEST_GST)
        assert not terminated and not truncated
    _, _, terminated, truncated, _ = env.step(AppraisalAction.REQUEST_GST)
    assert truncated is True  # Reached 20 steps
    
def test_combined_risk_bonus(base_config):
    # 10. Verify cumulative reward when finding multiple risks before recommending.
    config = base_config.copy()
    config["mock_litigation_risk"] = 0.8
    config["mock_promoter_risk"] = 0.7
    env = CreditAppraisalEnv(config)
    env.reset()
    
    # +0.15 + (-0.01 step)
    _, r1, _, _, _ = env.step(AppraisalAction.RUN_LITIGATION_SEARCH)
    # +0.15 + (-0.01 step)
    _, r2, _, _, _ = env.step(AppraisalAction.RUN_PROMOTER_NEWS_SEARCH)
    
    assert round(r1, 2) == 0.14
    assert round(r2, 2) == 0.14
    # Total accumulated rewards via env logic verification
    assert round(env.state.total_reward, 2) == 0.28

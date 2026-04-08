import gymnasium as gym
from creditsense_ai.env.CreditAppraisalEnv import CreditAppraisalEnv

def test_manual_loop():
    print("Initializing environment...")
    config = {"company_name": "Hackathon Corp", "decision": "APPROVE"}
    env = CreditAppraisalEnv(task_config=config)
    
    print("\n--- Resetting Environment ---")
    obs, info = env.reset(seed=42)
    print(f"Initial Observation Shape: {obs.shape}")
    
    steps = [
        (0, "REQUEST_GST"),
        (5, "RUN_CIRCULAR_TRADING_CHECK"),
        (10, "INPUT_MGMT_INTERVIEW")
    ]
    
    for action, name in steps:
        print(f"\n--- Taking Action: {name} (Action {action}) ---")
        obs, reward, terminated, truncated, info = env.step(action)
        print(f"Reward: {reward}")
        print(f"Terminated: {terminated} | Truncated: {truncated}")
        state = env.get_state()
        print(f"Step Count: {state.step_count}")
        print(f"Doc Completeness: {state.doc_completeness_pct}%")
        
    print("\nLoop completed successfully without crashing!")

if __name__ == "__main__":
    test_manual_loop()

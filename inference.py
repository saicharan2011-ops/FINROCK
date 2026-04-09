import os
import sys
import json
import argparse
import random
import yaml
import numpy as np
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

from creditsense_ai.env.CreditAppraisalEnv import CreditAppraisalEnv
from creditsense_ai.env.actions import AppraisalAction

HF_TOKEN = os.environ.get("HF_TOKEN", "dummy_token")
API_BASE_URL = os.environ.get("API_BASE_URL", "https://api.openai.com/v1")
MODEL_NAME = os.environ.get("MODEL_NAME", "gpt-4o")

client = OpenAI(
    api_key=HF_TOKEN,
    base_url=API_BASE_URL
)

def log_start(task: str, env: str, model: str):
    print(f"[START] task={task} env={env} model={model}", flush=True)

def log_step(step: int, action: str, reward: float, done: bool, error: str = None):
    error_val = error if error is not None else "null"
    done_val = str(done).lower()
    print(f"[STEP] step={step} action={action} reward={reward:.2f} done={done_val} error={error_val}", flush=True)

def log_end(success: bool, steps: int, score: float, rewards: list):
    rewards_str = ",".join(f"{r:.2f}" for r in rewards)
    success_val = str(success).lower()
    print(f"[END] success={success_val} steps={steps} score={score:.2f} rewards={rewards_str}", flush=True)

def greedy_agent(obs, state):
    ratios = state.financial_ratios
    docs = state.doc_completeness
    risks = state.risk_signals
    
    state_summary = f"""CreditState Summary:
Company Name: {state.company_name}
Loan Amount: {state.loan_amount}
Financial Ratios: DSCR={ratios.dscr}, D/E={ratios.de_ratio}, Current Ratio={ratios.current_ratio}, Ops Margin={ratios.op_margin}
Document Status: GST={docs.gst}, ITR={docs.itr}, Bank={docs.bank_stmt}, Annual_Report={docs.annual_report}, MCA={docs.mca}
Risk Flags: Litigation={risks.litigation_risk}, Promoter={risks.promoter_risk}, Circular={risks.circular_trading_flag}, Tamper={risks.tamper_detected}
"""
    sys.stderr.write(f"DEBUG: State summary generated for {state.company_name}\n")
    sys.stderr.flush()

    max_action = max(a.value for a in AppraisalAction)
    prompt = f"Given observation {obs.tolist()} and the following state summary:\n{state_summary}\nSelect the best action integer (0-{max_action})."
    
    try:
        response = client.chat.completions.create(
            model=MODEL_NAME,
            messages=[
                {"role": "system", "content": """You are a senior credit risk analyst for an Indian bank.
You must follow this decision order:
1. First collect all available documents (actions 0-3)
2. Then run fraud and risk checks (actions 4-9)
3. Only then make a recommendation (actions 10-12 or 9-11 per your enum)
Rules: Never request a document you already have. Never recommend before collecting
at least 2 documents. Always run circular trading check if GST is loaded.
Return ONLY a single integer. No explanation."""},
                {"role": "user",   "content": prompt}
            ],
            max_tokens=10,
            temperature=0.0
        )
        result = response.choices[0].message.content
        action = int(result.strip())
    except Exception as e:
        sys.stderr.write(f"DEBUG Error analyzing LLM response: {e}\n")
        sys.stderr.flush()
        action = 0  # REQUEST_GST
        
    if not (0 <= action <= max_action):
        sys.stderr.write(f"DEBUG Invalid action {action}, defaulting to 0\n")
        sys.stderr.flush()
        action = 0
        
    return action

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--task",  default="task1", help="Name of the task YAML inside tasks/")
    parser.add_argument("--seed",  type=int, default=42, help="Random seed for reproducibility")
    args = parser.parse_args()

    # Reproducibility
    random.seed(args.seed)
    np.random.seed(args.seed)

    task_file = f"creditsense_ai/tasks/{args.task}.yaml"
    task_config = {}
    if os.path.exists(task_file):
        try:
            with open(task_file, "r") as f:
                task_config = yaml.safe_load(f)
        except Exception as e:
            sys.stderr.write(f"ERROR: Failed to parse task config {task_file}: {e}\n")
            sys.exit(1)
    else:
        sys.stderr.write(f"ERROR: Task config file {task_file} not found.\n")
        sys.exit(1)

    env = CreditAppraisalEnv(task_config)
    obs, info = env.reset()

    log_start(task=args.task, env="CreditAppraisalEnv-v1", model=MODEL_NAME)

    done = False
    step_num = 0
    total_reward = 0.0
    action = 0
    rewards_list = []

    while not done:
        action = greedy_agent(obs, env.get_state())
        
        obs, reward, terminated, truncated, info = env.step(action)
        done = terminated or truncated
        total_reward += reward
        rewards_list.append(reward)
        step_num += 1

        try:
            action_name = AppraisalAction(action).name
        except ValueError:
            action_name = f"UNKNOWN_{action}"

        log_step(step=step_num, action=action_name, reward=reward, done=done, error=None)

        if step_num >= 50:
             sys.stderr.write("DEBUG Auto truncating after 50 steps\n")
             sys.stderr.flush()
             done = True
             if env.get_state().last_recommendation == "":
                 env.get_state().last_recommendation = "PARTIAL"

    final_decision = "UNKNOWN"
    if int(action) in [int(AppraisalAction.RECOMMEND_APPROVE), int(AppraisalAction.RECOMMEND_REJECT), int(AppraisalAction.RECOMMEND_PARTIAL)]:
        final_decision = AppraisalAction(action).name
    elif hasattr(env.get_state(), 'last_recommendation') and env.get_state().last_recommendation:
         final_decision = env.get_state().last_recommendation

    # Assume max possible reward per step is 1.0, max steps 50 -> 50.0 total
    score = min(max(total_reward / 50.0, 0.0), 1.0)
    success = score > 0.0

    log_end(success=success, steps=step_num, score=score, rewards=rewards_list)

if __name__ == "__main__":
    main()

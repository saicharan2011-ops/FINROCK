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

HF_TOKEN = os.environ["HF_TOKEN"]
API_BASE_URL = os.environ["API_BASE_URL"]
MODEL_NAME = os.environ["MODEL_NAME"]

client = OpenAI(
    api_key=HF_TOKEN,
    base_url=API_BASE_URL
)

def log_event(tag: str, data: dict):
    line = json.dumps({"tag": tag, **data})
    print(f"[{tag}] {line}", flush=True)

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
        with open(task_file, "r") as f:
            task_config = yaml.safe_load(f)
    else:
        sys.stderr.write(f"ERROR: Task config file {task_file} not found.\n")
        sys.exit(1)

    env = CreditAppraisalEnv(task_config)
    obs, info = env.reset()

    log_event("START", {
        "task": args.task,
        "seed": args.seed,
        "model": MODEL_NAME
    })

    done = False
    step_num = 0
    total_reward = 0.0
    action = 0

    while not done:
        action = greedy_agent(obs, env.get_state())
        
        obs, reward, terminated, truncated, info = env.step(action)
        done = terminated or truncated
        total_reward += reward
        step_num += 1

        try:
            action_name = AppraisalAction(action).name
        except ValueError:
            action_name = f"UNKNOWN_{action}"

        log_event("STEP", {
            "step": step_num,
            "action": int(action),
            "action_name": action_name,
            "reward": round(reward, 4),
            "done": done,
            "info": {k: str(v) for k, v in info.items()}
        })

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

    log_event("END", {
        "task": args.task,
        "total_steps": step_num,
        "total_reward": round(total_reward, 4),
        "final_recommendation": final_decision
    })

if __name__ == "__main__":
    main()

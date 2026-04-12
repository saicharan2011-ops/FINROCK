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
from credit_env import OpenEnvAdapter, grade_task

HF_TOKEN = os.environ.get("HF_TOKEN", "dummy_token")
API_BASE_URL = os.environ.get("API_BASE_URL", "https://api.openai.com/v1")
MODEL_NAME = os.environ.get("MODEL_NAME", "gpt-4o")

client = OpenAI(
    api_key=HF_TOKEN,
    base_url=API_BASE_URL
)

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
    max_action = 11 # 0-11 per new openenv.yaml
    prompt = f"Given observation {obs.tolist()} and the following state summary:\n{state_summary}\nSelect the best action integer (0-{max_action})."
    
    try:
        response = client.chat.completions.create(
            model=MODEL_NAME,
            messages=[
                {"role": "system", "content": """You are a senior credit risk analyst for an Indian bank.
You must follow this decision order:
1. First collect all available documents (actions 0-4)
2. Then run fraud and risk checks (actions 5-8)
3. Only then make a recommendation (action 11)
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
    except Exception:
        action = 0
        
    return action

def run_task(task_id: str) -> float:
    """Run one episode and return the graded score 0.0–1.0."""
    try:
        # Load task config
        task_file = f"creditsense_ai/tasks/{task_id}.yaml"
        task_config = {}
        if os.path.exists(task_file):
            with open(task_file, "r") as f:
                task_config = yaml.safe_load(f)
        
        env = CreditAppraisalEnv(task_config)
        obs, _ = env.reset(seed=42)
        
        done = False
        step_num = 0
        
        while not done and step_num < 15:
            action = greedy_agent(obs, env.get_state())
            obs, _, terminated, truncated, _ = env.step(action)
            done = terminated or truncated
            step_num += 1
            
        # Grade the result
        state_dict = env.get_state().model_dump() if hasattr(env.get_state(), "model_dump") else {}
        # For task_hard, we'd ideally have cam_text, but we'll use empty for now or 
        # assume the grader handles it.
        return grade_task(task_id, state_dict)
    except Exception as e:
        print(f"[ERROR] task {task_id}: {e}", file=sys.stderr)
        return 0.0

if __name__ == "__main__":
    results = {
        "task_easy":   run_task("task_easy"),
        "task_medium": run_task("task_medium"),
        "task_hard":   run_task("task_hard"),
    }

    # This JSON block is what the validator parses — do NOT remove
    print(json.dumps({
        "tasks": [
            {"task_id": "task_easy",   "score": results["task_easy"],   "grader": "ratio_accuracy"},
            {"task_id": "task_medium", "score": results["task_medium"],  "grader": "fraud_detection"},
            {"task_id": "task_hard",   "score": results["task_hard"],    "grader": "llm_judge"},
        ],
        "average_score": round(sum(results.values()) / 3, 4),
        "environment": "CreditSenseAI-v1",
    }, indent=2))

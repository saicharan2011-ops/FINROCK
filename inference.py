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
    max_action = 13 # 0-13 per AppraisalAction enum
    prompt = f"Given observation {obs.tolist()} and the following state summary:\n{state_summary}\nSelect the best action integer (0-{max_action})."
    
    try:
        response = client.chat.completions.create(
            model=MODEL_NAME,
            messages=[
                {"role": "system", "content": """You are a senior credit risk analyst for an Indian bank.
You must follow this decision order:
1. First collect all available documents (actions 0-4)
2. Then run fraud and risk checks (actions 5-8)
3. Only then make a recommendation (actions 11-13)
Rules: Never request a document you already have. Never recommend before collecting
at least 2 documents. Always run circular trading check if GST is loaded.
Action 11 = APPROVE, 12 = REJECT, 13 = PARTIAL.
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
        # 1. Start block - Ensure exact format required by validator
        print(f"[START] task={task_id}", flush=True)

        # Map task IDs to file names if necessary
        task_map = {
            "task_easy": "task1",
            "task_medium": "task2",
            "task_hard": "task3"
        }
        file_id = task_map.get(task_id, task_id)
        
        # Load task config
        task_file = f"creditsense_ai/tasks/{file_id}.yaml"
        task_config = {}
        if os.path.exists(task_file):
            with open(task_file, "r") as f:
                task_config = yaml.safe_load(f)
        else:
            print(f"Warning: Task file {task_file} not found, using empty config", file=sys.stderr)
        
        env = CreditAppraisalEnv(task_config)
        obs, _ = env.reset(seed=42)
        
        done = False
        step_num = 0
        
        while not done and step_num < 15:
            action = greedy_agent(obs, env.get_state())
            obs, reward, terminated, truncated, _ = env.step(action)
            
            # 2. Step block - Ensure exact format required by validator
            # Round reward to 4 decimal places for consistency
            print(f"[STEP] step={step_num} reward={round(float(reward), 4)}", flush=True)

            done = terminated or truncated
            step_num += 1
            
        # Grade the result
        state = env.get_state()
        state_dict = state.model_dump() if hasattr(state, "model_dump") else {}
        score = grade_task(task_id, state_dict)

        # 3. End block - Ensure exact format required by validator
        print(f"[END] task={task_id} score={round(float(score), 4)} steps={step_num}", flush=True)

        return float(score)
    except Exception as e:
        # Use stderr for errors so they don't mess up stdout parsing
        import traceback
        print(f"Error in task {task_id}: {e}", file=sys.stderr, flush=True)
        traceback.print_exc(file=sys.stderr)
        # We still need to print END even on error, or validator might hang
        print(f"[END] task={task_id} score=0.0 steps=0", flush=True)
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
    }, indent=2), flush=True)

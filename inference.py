#!/usr/bin/env python3
"""
inference.py – OpenEnv Phase-2 evaluation entry point.

CRITICAL: This script MUST print [START]/[STEP]/[END] blocks to stdout.
All imports are deferred and wrapped so the script never dies silently.
"""

# === ONLY stdlib imports at top level — nothing that can crash ===
import os
import sys
import json
import traceback

# Force Python to never buffer stdout
os.environ["PYTHONUNBUFFERED"] = "1"


def safe_print(msg: str) -> None:
    """Always prints to stdout and flushes. Never raises."""
    try:
        sys.stdout.write(msg + "\n")
        sys.stdout.flush()
    except Exception:
        pass


def _clamp(score: float) -> float:
    """Clamp score to (0, 1) — validator rejects exactly 0.0 or 1.0."""
    return round(max(0.01, min(0.99, score)), 4)


def _load_deps():
    """
    Lazily import every heavy dependency.
    Returns a dict of the loaded objects, or raises on failure.
    """
    from openai import OpenAI
    from dotenv import load_dotenv

    load_dotenv()

    # Import environment and grader
    from creditsense_ai.env.CreditAppraisalEnv import CreditAppraisalEnv
    from creditsense_ai.env.actions import AppraisalAction
    from credit_env import grade_task

    return {
        "OpenAI": OpenAI,
        "CreditAppraisalEnv": CreditAppraisalEnv,
        "AppraisalAction": AppraisalAction,
        "grade_task": grade_task,
    }


def _load_task_config(task_id: str) -> dict:
    """Load a task YAML file. Returns {} on any failure."""
    task_map = {
        "task_easy": "task1",
        "task_medium": "task2",
        "task_hard": "task3",
    }
    file_id = task_map.get(task_id, task_id)
    task_file = os.path.join("creditsense_ai", "tasks", f"{file_id}.yaml")

    if not os.path.exists(task_file):
        print(f"Warning: {task_file} not found", file=sys.stderr, flush=True)
        return {}

    try:
        import yaml
        with open(task_file, "r") as fh:
            return yaml.safe_load(fh) or {}
    except ImportError:
        # pyyaml missing – fall back to a very simple parser
        print("Warning: pyyaml not installed, reading task file as raw text",
              file=sys.stderr, flush=True)
        try:
            with open(task_file, "r") as fh:
                import json as _json
                # Try json just in case; otherwise return empty
                return _json.loads(fh.read())
        except Exception:
            return {}
    except Exception as exc:
        print(f"Warning: could not parse {task_file}: {exc}",
              file=sys.stderr, flush=True)
        return {}


def _build_client():
    """Build and return an OpenAI-compatible client."""
    from openai import OpenAI

    hf_token = os.environ.get("HF_TOKEN", "dummy_token")
    api_base = os.environ.get("API_BASE_URL", "https://api.openai.com/v1")

    return OpenAI(api_key=hf_token, base_url=api_base)


def greedy_agent(client, model_name, obs, state):
    """Ask the LLM for the next action integer (0-13)."""
    try:
        ratios = state.financial_ratios
        docs = state.doc_completeness
        risks = state.risk_signals

        state_summary = (
            f"Company: {state.company_name}, Loan: {state.loan_amount}\n"
            f"Ratios: DSCR={ratios.dscr}, D/E={ratios.de_ratio}, "
            f"CR={ratios.current_ratio}, OpMargin={ratios.op_margin}\n"
            f"Docs: GST={docs.gst}, ITR={docs.itr}, Bank={docs.bank_stmt}, "
            f"AR={docs.annual_report}, MCA={docs.mca}\n"
            f"Risks: Litigation={risks.litigation_risk}, "
            f"Promoter={risks.promoter_risk}, "
            f"Circular={risks.circular_trading_flag}, "
            f"Tamper={risks.tamper_detected}"
        )

        prompt = (
            f"Observation vector: {obs.tolist()}\n"
            f"State:\n{state_summary}\n"
            f"Select the best action integer (0-13)."
        )

        response = client.chat.completions.create(
            model=model_name,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a senior credit risk analyst for an Indian bank.\n"
                        "Decision order:\n"
                        "1. Collect documents (actions 0-4)\n"
                        "2. Run fraud / risk checks (actions 5-8)\n"
                        "3. Make recommendation (11=APPROVE, 12=REJECT, 13=PARTIAL)\n"
                        "Rules: Never re-request a document already collected. "
                        "Never recommend before collecting >=2 docs. "
                        "Always run circular-trading check if GST loaded.\n"
                        "Return ONLY a single integer."
                    ),
                },
                {"role": "user", "content": prompt},
            ],
            max_tokens=10,
            temperature=0.0,
        )
        result = response.choices[0].message.content.strip()
        action = int(result)
        return max(0, min(action, 13))
    except Exception as exc:
        print(f"LLM agent error: {exc}", file=sys.stderr, flush=True)
        return 0  # safe fallback: request GST


def run_task(task_id: str, deps: dict) -> float:
    """
    Run one episode for *task_id*.
    ALWAYS prints [START] … [STEP] … [END] to stdout no matter what.
    Returns the graded score (0.0-1.0).
    """
    CreditAppraisalEnv = deps["CreditAppraisalEnv"]
    grade_task = deps["grade_task"]

    # ── [START] ──────────────────────────────────────────────────────
    safe_print(f"[START] task={task_id}")

    step_num = 0
    score = 0.0

    try:
        # Load task config
        task_config = _load_task_config(task_id)

        # Build environment
        env = CreditAppraisalEnv(task_config)
        obs, _ = env.reset(seed=42)

        # Build LLM client
        client = _build_client()
        model_name = os.environ.get("MODEL_NAME", "gpt-4o")

        done = False
        max_steps = task_config.get("max_steps", 15)

        while not done and step_num < max_steps:
            action = greedy_agent(client, model_name, obs, env.get_state())
            obs, reward, terminated, truncated, _ = env.step(action)

            # ── [STEP] ──────────────────────────────────────────────
            safe_print(f"[STEP] step={step_num} reward={round(float(reward), 4)}")

            done = terminated or truncated
            step_num += 1

        # Grade
        state = env.get_state()
        state_dict = state.model_dump() if hasattr(state, "model_dump") else {}
        score = float(grade_task(task_id, state_dict))

    except Exception as exc:
        print(f"Error running {task_id}: {exc}", file=sys.stderr, flush=True)
        traceback.print_exc(file=sys.stderr)
        # Ensure at least one STEP exists so the validator sees the pattern
        if step_num == 0:
            safe_print(f"[STEP] step=0 reward=0.0")
            step_num = 1

    # Clamp score to valid range (0, 1)
    score = _clamp(score)

    # ── [END] ────────────────────────────────────────────────────────
    safe_print(f"[END] task={task_id} score={score} steps={step_num}")
    return score


def main() -> None:
    """Entry-point: run all three tasks and emit results."""
    task_ids = ["task_easy", "task_medium", "task_hard"]
    grader_map = {
        "task_easy": "ratio_accuracy",
        "task_medium": "fraud_detection",
        "task_hard": "llm_judge",
    }

    # ── Try to load real dependencies ────────────────────────────────
    deps = None
    try:
        deps = _load_deps()
    except Exception as exc:
        print(f"FATAL import error: {exc}", file=sys.stderr, flush=True)
        traceback.print_exc(file=sys.stderr)

    results: dict[str, float] = {}

    if deps is not None:
        # Normal path — run each task with the real environment
        for tid in task_ids:
            results[tid] = run_task(tid, deps)
    else:
        # Fallback path — deps unavailable; still MUST emit valid markers
        for tid in task_ids:
            safe_print(f"[START] task={tid}")
            safe_print(f"[STEP] step=0 reward=0.0")
            safe_print(f"[END] task={tid} score=0.01 steps=1")
            results[tid] = 0.01

    # ── Final JSON summary (some validators also look for this) ──────
    summary = {
        "tasks": [
            {
                "task_id": tid,
                "score": results.get(tid, 0.0),
                "grader": grader_map.get(tid, "unknown"),
            }
            for tid in task_ids
        ],
        "average_score": round(sum(results.values()) / max(len(results), 1), 4),
        "environment": "CreditSenseAI-v1",
    }
    safe_print(json.dumps(summary, indent=2))


# ═══════════════════════════════════════════════════════════════════════
if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        # ABSOLUTE last-resort: if main() itself dies, emit valid markers
        print(f"CRITICAL: main() crashed: {exc}", file=sys.stderr, flush=True)
        traceback.print_exc(file=sys.stderr)
        for tid in ["task_easy", "task_medium", "task_hard"]:
            safe_print(f"[START] task={tid}")
            safe_print(f"[STEP] step=0 reward=0.0")
            safe_print(f"[END] task={tid} score=0.01 steps=1")
        safe_print(json.dumps({
            "tasks": [
                {"task_id": "task_easy", "score": 0.01, "grader": "ratio_accuracy"},
                {"task_id": "task_medium", "score": 0.01, "grader": "fraud_detection"},
                {"task_id": "task_hard", "score": 0.01, "grader": "llm_judge"},
            ],
            "average_score": 0.01,
            "environment": "CreditSenseAI-v1",
        }, indent=2))

from __future__ import annotations

import os
from typing import Any, Dict

import numpy as np

from creditsense_ai.env.CreditAppraisalEnv import CreditAppraisalEnv


TASKS = [
    {
        "id": "task_easy",
        "name": "Financial Ratio Extraction",
        "difficulty": "easy",
        "description": (
            "Collect GST and bank statement documents, then compute "
            "5 financial ratios within ±5% tolerance."
        ),
        "max_steps": 8,
        "graders": [
            {
                "type": "ratio_accuracy",
                "metric": "correct_ratios_out_of_5",
                "partial_credit": True,
            }
        ],
    },
    {
        "id": "task_medium",
        "name": "Circular Trading Detection",
        "difficulty": "medium",
        "description": (
            "Detect a planted GST invoice cycle (A→B→C→A) that inflates "
            "declared revenue by 30% and make the correct lending decision."
        ),
        "max_steps": 10,
        "graders": [
            {
                "type": "fraud_detection",
                "metric": "circular_trading_detected",
                "partial_credit": True,
            }
        ],
    },
    {
        "id": "task_hard",
        "name": "Full CAM with Multi-Signal Decision",
        "difficulty": "hard",
        "description": (
            "Integrate circular trading, litigation, and a site-visit primary "
            "insight to produce a complete Credit Appraisal Memo with the "
            "correct lending recommendation."
        ),
        "max_steps": 15,
        "graders": [
            {
                "type": "llm_judge",
                "metric": "cam_quality_and_decision_accuracy",
                "partial_credit": True,
            }
        ],
    },
]


def _clamp_score(score: float) -> float:
    """Clamp score to (0, 1) — the OpenEnv validator rejects exactly 0.0 or 1.0."""
    return round(max(0.01, min(0.99, score)), 4)


def _grade_easy(state: dict) -> float:
    ratios = state.get("financial_ratios", {})
    required = ["de_ratio", "dscr", "current_ratio", "interest_coverage", "op_margin"]
    correct = sum(1 for r in required if ratios.get(r) is not None)
    return _clamp_score(correct / len(required))


def _grade_medium(state: dict) -> float:
    flags = state.get("risk_signals", {})
    detected = flags.get("circular_trading_flag", 0.0) > 0.0
    recommendation = state.get("last_recommendation", "").upper()
    correct_decision = recommendation in ("REJECT", "PARTIAL")

    if detected and correct_decision:
        return _clamp_score(1.0)
    elif detected and not correct_decision:
        return _clamp_score(0.5)
    elif not detected and correct_decision:
        return _clamp_score(0.2)
    return _clamp_score(0.0)


def _grade_hard(state: dict, cam_text: str = "") -> float:
    score = 0.0
    recommendation = state.get("last_recommendation", "").upper()

    # Five Cs coverage — check cam_text for section keywords
    sections = {
        "character": 0.15,
        "capacity": 0.20,
        "capital": 0.15,
        "collateral": 0.10,
        "conditions": 0.15,
    }
    cam_lower = cam_text.lower()
    for section, weight in sections.items():
        if section in cam_lower:
            score += weight

    # Correct terminal decision (ground truth for hard task = PARTIAL or REJECT)
    if recommendation in ("REJECT", "PARTIAL"):
        score += 0.25

    return _clamp_score(min(score, 1.0))


def grade_task(task_id: str, state: dict, cam_text: str = "") -> float:
    """
    Returns a score 0.0–1.0 for the completed episode.
    """
    if task_id == "task_easy":
        return _grade_easy(state)
    elif task_id == "task_medium":
        return _grade_medium(state)
    elif task_id == "task_hard":
        return _grade_hard(state, cam_text)
    return _clamp_score(0.0)


class OpenEnvAdapter:
    """
    Minimal OpenEnv-compatible adapter exposing reset/step/state.
    """

    def __init__(self) -> None:
        self.env = CreditAppraisalEnv({})
        self.last_obs: np.ndarray | None = None
        self.last_info: Dict[str, Any] = {}
        self.current_task_id: str | None = None

    def reset(self, seed: int | None = None, task_id: str | None = None) -> Dict[str, Any]:
        self.current_task_id = task_id
        # Load task config if possible
        task_config = {}
        if task_id:
            import yaml
            task_path = f"creditsense_ai/tasks/{task_id}.yaml"
            if not os.path.exists(task_path):
                # fallback for task names without .yaml
                task_path = f"creditsense_ai/tasks/{task_id}.yaml"
            
            if os.path.exists(task_path):
                with open(task_path, "r") as f:
                    task_config = yaml.safe_load(f)
        
        self.env = CreditAppraisalEnv(task_config)
        obs, info = self.env.reset(seed=seed)
        self.last_obs = obs
        self.last_info = info or {}
        return {"observation": obs.tolist(), "info": self.last_info}

    def step(self, action: int) -> Dict[str, Any]:
        obs, reward, terminated, truncated, info = self.env.step(int(action))
        self.last_obs = obs
        self.last_info = info or {}
        
        # Calculate graded score if terminated
        score = 0.0
        if terminated and self.current_task_id:
            state_dict = self.state()
            score = grade_task(self.current_task_id, state_dict)

        return {
            "observation": obs.tolist(),
            "reward": float(reward),
            "score": float(score),
            "terminated": bool(terminated),
            "truncated": bool(truncated),
            "info": self.last_info,
        }

    def state(self) -> Dict[str, Any]:
        state = self.env.get_state()
        return state.model_dump() if hasattr(state, "model_dump") else {}


__all__ = ["CreditAppraisalEnv", "OpenEnvAdapter", "TASKS", "grade_task"]


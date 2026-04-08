from __future__ import annotations

from typing import Any, Dict

import numpy as np

from creditsense_ai.env.CreditAppraisalEnv import CreditAppraisalEnv


class OpenEnvAdapter:
    """
    Minimal OpenEnv-compatible adapter exposing reset/step/state.
    """

    def __init__(self) -> None:
        self.env = CreditAppraisalEnv({})
        self.last_obs: np.ndarray | None = None
        self.last_info: Dict[str, Any] = {}

    def reset(self, seed: int | None = None) -> Dict[str, Any]:
        obs, info = self.env.reset(seed=seed)
        self.last_obs = obs
        self.last_info = info or {}
        return {"observation": obs.tolist(), "info": self.last_info}

    def step(self, action: int) -> Dict[str, Any]:
        obs, reward, terminated, truncated, info = self.env.step(int(action))
        self.last_obs = obs
        self.last_info = info or {}
        return {
            "observation": obs.tolist(),
            "reward": float(reward),
            "terminated": bool(terminated),
            "truncated": bool(truncated),
            "info": self.last_info,
        }

    def state(self) -> Dict[str, Any]:
        state = self.env.get_state()
        return state.model_dump() if hasattr(state, "model_dump") else {}


__all__ = ["CreditAppraisalEnv", "OpenEnvAdapter"]


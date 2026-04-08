from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Any, Dict


def emit_stdout_event(tag: str, stage: str, **data: Any) -> None:
    """
    Emit structured stdout event lines with strict lifecycle tags.
    Expected tag values: START, STOP, END
    """
    payload: Dict[str, Any] = {
        "tag": tag,
        "stage": stage,
        "ts": datetime.now(timezone.utc).isoformat(),
    }
    payload.update(data)
    print(json.dumps(payload, ensure_ascii=False), flush=True)


import asyncio
import json
import os
from pathlib import Path

import requests
import websockets


BACKEND_HTTP = os.environ.get("BACKEND_HTTP", "http://127.0.0.1:8020").rstrip("/")
BACKEND_WS = os.environ.get("BACKEND_WS", BACKEND_HTTP.replace("http://", "ws://").replace("https://", "wss://")).rstrip("/")


def _post_json(url: str, payload: dict) -> dict:
    r = requests.post(url, json=payload, timeout=60)
    r.raise_for_status()
    return r.json()


def _upload(session_id: str, doc_type: str, path: Path) -> None:
    with path.open("rb") as f:
        files = {"file": (path.name, f)}
        r = requests.post(f"{BACKEND_HTTP}/api/sessions/{session_id}/documents/{doc_type}", files=files, timeout=120)
    r.raise_for_status()


async def _run_ws(session_id: str, timeout_s: int = 120) -> tuple[list[dict], dict]:
    logs = []
    last_metrics = {}
    ws_url = f"{BACKEND_WS}/ws/analyze/{session_id}"
    async with websockets.connect(ws_url, ping_interval=20, ping_timeout=20) as ws:
        await ws.send(json.dumps({"command": "start"}))
        end_at = asyncio.get_event_loop().time() + timeout_s
        while asyncio.get_event_loop().time() < end_at:
            try:
                raw = await asyncio.wait_for(ws.recv(), timeout=2.0)
            except asyncio.TimeoutError:
                continue
            msg = json.loads(raw)
            if msg.get("type") == "log":
                logs.append(msg.get("payload") or {})
            elif msg.get("type") == "metrics":
                last_metrics = msg.get("payload") or {}
                if int(last_metrics.get("completionScore") or 0) >= 100:
                    break
    return logs, last_metrics


def _get_results_retry(session_id: str, tries: int = 15) -> dict:
    last_exc = None
    for _ in range(tries):
        try:
            r = requests.get(f"{BACKEND_HTTP}/api/sessions/{session_id}/results", timeout=60)
            r.raise_for_status()
            return r.json()
        except Exception as exc:
            last_exc = exc
            asyncio.run(asyncio.sleep(0.4))
    raise last_exc


def _check_cam(session_id: str) -> bool:
    r = requests.get(f"{BACKEND_HTTP}/api/sessions/{session_id}/cam.docx", timeout=120)
    return r.status_code == 200 and len(r.content) > 1024


def _verify_doc(session_id: str, path: Path) -> dict:
    with path.open("rb") as f:
        files = {"file": (path.name, f)}
        r = requests.post(f"{BACKEND_HTTP}/api/sessions/{session_id}/verify-document", files=files, timeout=120)
    r.raise_for_status()
    return r.json()


def main():
    demo_dir = Path(__file__).resolve().parent.parent / "tests" / "demo_docs"
    annual = demo_dir / "court_record_demo.pdf"
    gst = demo_dir / "gst_filing_demo.pdf"
    bank = demo_dir / "bank_statement_demo.pdf"
    itr = demo_dir / "court_record_demo.pdf"  # proxy demo doc for ITR slot

    session = _post_json(
        f"{BACKEND_HTTP}/api/sessions",
        {"company_name": "Google", "loan_amount": 4200000},
    )
    session_id = session["session_id"]

    _upload(session_id, "annual", annual)
    _upload(session_id, "gst", gst)
    _upload(session_id, "bank", bank)
    _upload(session_id, "itr", itr)

    logs, ws_metrics = asyncio.run(_run_ws(session_id))
    results = _get_results_retry(session_id)
    cam_ok = _check_cam(session_id)
    verify = _verify_doc(session_id, annual)

    gauges = ws_metrics.get("gauges") or results.get("gauges") or {}
    checks = {
        "session_create": bool(session_id),
        "uploaded_4_docs": True,
        "ws_connected_and_completed": int(ws_metrics.get("completionScore") or 0) >= 100,
        "results_endpoint": bool(results.get("decision")),
        "cam_download": cam_ok,
        "audit_verify_match": bool(verify.get("matched")),
        "research_stage_seen_in_logs": any("RESEARCH_AGENT" == (x.get("action") or "") for x in logs),
        "gauges_non_zero_any": any(int(gauges.get(k, 0)) > 0 for k in ("circular", "shell", "lien", "pep")),
    }

    report = {
        "backend_http": BACKEND_HTTP,
        "session_id": session_id,
        "decision": results.get("decision"),
        "completion": ws_metrics.get("completionScore"),
        "gauges": gauges,
        "verify_result": {
            "matched": verify.get("matched"),
            "matched_doc_types": verify.get("matched_doc_types"),
        },
        "checks": checks,
        "logs_tail": logs[-8:],
    }
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()

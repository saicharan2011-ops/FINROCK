import asyncio
import json
import os
from pathlib import Path

import requests
import websockets


BACKEND_HTTP = os.environ.get("BACKEND_HTTP", "http://127.0.0.1:8000").rstrip("/")
BACKEND_WS = os.environ.get("BACKEND_WS", BACKEND_HTTP.replace("http://", "ws://").replace("https://", "wss://")).rstrip(
    "/"
)


def create_session(company_name: str, loan_amount: float) -> str:
    r = requests.post(
        f"{BACKEND_HTTP}/api/sessions",
        json={"company_name": company_name, "loan_amount": loan_amount},
        timeout=60,
    )
    r.raise_for_status()
    return r.json()["session_id"]


def upload(session_id: str, doc_type: str, file_path: Path):
    with file_path.open("rb") as f:
        files = {"file": (file_path.name, f)}
        r = requests.post(f"{BACKEND_HTTP}/api/sessions/{session_id}/documents/{doc_type}", files=files, timeout=120)
    r.raise_for_status()


async def run_ws(session_id: str, max_seconds: int = 60):
    ws_url = f"{BACKEND_WS}/ws/analyze/{session_id}"
    async with websockets.connect(ws_url, ping_interval=20, ping_timeout=20) as ws:
        await ws.send(json.dumps({"command": "start"}))
        deadline = asyncio.get_event_loop().time() + max_seconds
        last_metrics = None
        while asyncio.get_event_loop().time() < deadline:
            try:
                msg = await asyncio.wait_for(ws.recv(), timeout=2.0)
            except asyncio.TimeoutError:
                continue
            data = json.loads(msg)
            if data.get("type") == "log":
                payload = data.get("payload") or {}
                print(f"[LOG] {payload.get('action','')}: {payload.get('message','')}")
            if data.get("type") == "metrics":
                last_metrics = data.get("payload") or {}
                print(f"[METRICS] completion={last_metrics.get('completionScore')} decision={last_metrics.get('decision')}")
                if int(last_metrics.get("completionScore") or 0) >= 100:
                    break
        return last_metrics


def get_results(session_id: str):
    r = requests.get(f"{BACKEND_HTTP}/api/sessions/{session_id}/results", timeout=60)
    r.raise_for_status()
    return r.json()


def get_results_with_retry(session_id: str, tries: int = 10, sleep_s: float = 0.6):
    last_exc = None
    for _ in range(tries):
        try:
            return get_results(session_id)
        except Exception as e:
            last_exc = e
            import time

            time.sleep(sleep_s)
    raise last_exc


def main():
    demo_dir = Path(__file__).resolve().parent.parent / "tests" / "demo_docs"
    assert demo_dir.exists(), f"Missing demo docs dir: {demo_dir}. Run tools/generate_demo_pdfs.py first."

    session_id = create_session("Google (Demo Research)", 4200000)
    print("session_id:", session_id)

    # Upload demo PDFs
    upload(session_id, "annual", demo_dir / "court_record_demo.pdf")
    upload(session_id, "gst", demo_dir / "gst_filing_demo.pdf")
    upload(session_id, "bank", demo_dir / "bank_statement_demo.pdf")

    # Run pipeline via WS
    asyncio.run(run_ws(session_id))

    # Fetch results + CAM link
    results = get_results_with_retry(session_id)
    print("\n=== RESULTS ===")
    print(json.dumps(results, indent=2)[:4000])
    print("\nCAM:", f"{BACKEND_HTTP}/api/sessions/{session_id}/cam.docx")


if __name__ == "__main__":
    main()


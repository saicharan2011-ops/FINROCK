import asyncio
import os
from typing import Any, Dict, List, Optional, Tuple

import requests
import streamlit as st

try:
    import websockets  # type: ignore
except Exception:  # pragma: no cover
    websockets = None


BACKEND_HTTP = os.environ.get("BACKEND_HTTP", "http://127.0.0.1:8000").rstrip("/")
BACKEND_WS = os.environ.get("BACKEND_WS", BACKEND_HTTP.replace("http://", "ws://").replace("https://", "wss://")).rstrip(
    "/"
)


st.set_page_config(page_title="CreditSense AI", page_icon="🧾", layout="wide")


def _http(method: str, path: str, **kwargs):
    url = f"{BACKEND_HTTP}{path}"
    return requests.request(method, url, timeout=120, **kwargs)


def create_session(company_name: str, loan_amount: float) -> str:
    r = _http("POST", "/api/sessions", json={"company_name": company_name, "loan_amount": loan_amount})
    r.raise_for_status()
    return r.json()["session_id"]


def upload_doc(session_id: str, doc_type: str, file_bytes: bytes, filename: str) -> None:
    files = {"file": (filename, file_bytes)}
    r = _http("POST", f"/api/sessions/{session_id}/documents/{doc_type}", files=files)
    r.raise_for_status()


def get_results(session_id: str) -> Dict[str, Any]:
    r = _http("GET", f"/api/sessions/{session_id}/results")
    r.raise_for_status()
    return r.json()


def cam_url(session_id: str) -> str:
    return f"{BACKEND_HTTP}/api/sessions/{session_id}/cam.docx"


async def _run_ws_analysis(session_id: str, max_seconds: int = 45) -> Tuple[List[Dict[str, Any]], Optional[Dict[str, Any]]]:
    if websockets is None:
        raise RuntimeError("Missing websockets dependency. Install `websockets`.")

    ws_url = f"{BACKEND_WS}/ws/analyze/{session_id}"
    logs: List[Dict[str, Any]] = []
    last_metrics: Optional[Dict[str, Any]] = None

    async with websockets.connect(ws_url, ping_interval=20, ping_timeout=20) as ws:
        await ws.send('{"command":"start"}')
        deadline = asyncio.get_event_loop().time() + max_seconds

        while asyncio.get_event_loop().time() < deadline:
            try:
                msg = await asyncio.wait_for(ws.recv(), timeout=2.0)
            except asyncio.TimeoutError:
                continue

            try:
                import json

                data = json.loads(msg)
            except Exception:
                continue

            if data.get("type") == "log":
                payload = data.get("payload") or {}
                logs.insert(0, payload)
            elif data.get("type") == "metrics":
                payload = data.get("payload") or {}
                last_metrics = payload

                # Heuristic "done": completionScore hits 100 or decision becomes non-pending.
                completion = int(payload.get("completionScore") or 0)
                decision = str(payload.get("decision") or "").lower()
                if completion >= 100 or decision in {"approve", "reject", "partial"}:
                    break

    return logs, last_metrics


st.markdown("## CreditSense AI — Judge Console")
st.caption(f"Backend HTTP: `{BACKEND_HTTP}`  •  Backend WS: `{BACKEND_WS}`")

left, right = st.columns([0.42, 0.58], gap="large")

with left:
    st.markdown("### 1) Create / Load Session")
    company_name = st.text_input("Company name", value=st.session_state.get("company_name", "Nexus Global"))
    loan_amount = st.number_input("Loan amount", min_value=0.0, value=float(st.session_state.get("loan_amount", 4200000.0)))

    c1, c2 = st.columns(2)
    with c1:
        if st.button("Create session", use_container_width=True):
            sid = create_session(company_name, float(loan_amount))
            st.session_state["session_id"] = sid
            st.session_state["company_name"] = company_name
            st.session_state["loan_amount"] = float(loan_amount)
            st.success(f"Session created: {sid}")
    with c2:
        sid_in = st.text_input("Existing session_id", value=st.session_state.get("session_id", ""))
        if st.button("Use session_id", use_container_width=True):
            st.session_state["session_id"] = sid_in.strip()

    session_id = (st.session_state.get("session_id") or "").strip()
    st.markdown("### 2) Upload Documents")
    st.caption("Upload whatever you have — the pipeline degrades gracefully and still produces a CAM.")

    docs = [
        ("gst", "GST Certificate (PDF/JSON)"),
        ("bank", "Bank Statement (PDF/CSV)"),
        ("annual", "Annual Report (PDF)"),
        ("itr", "ITR Filing (PDF)"),
    ]

    for key, label in docs:
        up = st.file_uploader(label, key=f"up_{key}", type=None)
        if up is not None and st.button(f"Upload {key.upper()}", key=f"btn_{key}", use_container_width=True, disabled=not session_id):
            upload_doc(session_id, key, up.getvalue(), up.name)
            st.success(f"Uploaded: {up.name}")

    st.markdown("### 3) Run Analysis")
    run = st.button("Run analysis via WebSocket", type="primary", use_container_width=True, disabled=not session_id)
    if run:
        with st.spinner("Running pipeline (live logs)..."):
            logs, metrics = asyncio.run(_run_ws_analysis(session_id))
            st.session_state["last_logs"] = logs
            st.session_state["last_metrics"] = metrics

    st.markdown("### 4) Download CAM")
    st.link_button("Download CAM (.docx)", cam_url(session_id) if session_id else "#", disabled=not session_id, use_container_width=True)
    st.link_button("FastAPI docs (/docs)", f"{BACKEND_HTTP}/docs", use_container_width=True)

with right:
    st.markdown("### Live Output")
    metrics = st.session_state.get("last_metrics") or {}
    logs = st.session_state.get("last_logs") or []

    m1, m2, m3, m4 = st.columns(4)
    m1.metric("Decision", str(metrics.get("decision") or "—").upper())
    m2.metric("Completion", f"{metrics.get('completionScore', 0)}%")
    m3.metric("Integrity", f"{metrics.get('integrity', 0)}%")
    m4.metric("Transparency", f"{metrics.get('transparency', 0)}%")

    st.markdown("#### Agent logs")
    if logs:
        for item in logs[:25]:
            st.write(f"- **{item.get('action','LOG')}**: {item.get('message','')}")
    else:
        st.info("Run analysis to stream logs here.")

    st.markdown("#### Results snapshot")
    if session_id:
        if st.button("Refresh results", use_container_width=True):
            try:
                st.session_state["last_results"] = get_results(session_id)
            except Exception as e:
                st.warning(f"Results not ready: {e}")

    if st.session_state.get("last_results"):
        st.json(st.session_state["last_results"])


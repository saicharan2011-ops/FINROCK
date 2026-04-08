---
title: CreditSense AI
emoji: 🧾
colorFrom: green
colorTo: gray
sdk: docker
app_port: 8501
pinned: false
---

## CreditSense AI (Hackathon Finals Build)

**Problem:** Manual credit appraisal in India still runs on fragmented documents and a 3-week turnaround time—with major blind spots for sophisticated frauds like circular trading. Banks also lack an immutable audit trail when AI is involved in the decision loop.

**Solution:** **CreditSense AI** is an autonomous credit research + appraisal pipeline that converts multi-format evidence (GST, bank statements, filings) into a judge-ready **CAM** in ~40 seconds. Using **TurboQuant** for memory‑optimal reasoning and a **Polygon (Amoy) “Glass Box” audit trail**, every critical step can be reconstructed and verified.

---

## What judges should try (2 minutes)

1. Open the app UI (Streamlit) at `/:8501` and click **Create session**.
2. Upload any document(s) you have (even 1 is enough for demo).
3. Click **Run analysis via WebSocket** to stream agent logs live.
4. Download the generated **CAM (.docx)** and open the **Audit** metadata inside results.

Backend docs are available at `/:8000/docs`.

---

## Architecture (production demo)

- **Frontend (Judges)**: Streamlit UI on **8501**
- **API**: FastAPI on **8000**
- **Realtime**: WebSocket `GET /ws/analyze/{session_id}` with `{"command":"start"}`
- **Core pipeline**:
  - Multi-document parsing (GST + Bank + PDFs)
  - Circular trading detection (graph-based)
  - Research agent (LLM-backed with graceful fallback)
  - CAM generation (`.docx`)
  - Optional blockchain anchoring (hash + events)

---

## Environment variables (.env)

Set these locally via a `.env` file. On HuggingFace Spaces, set them in **Settings → Variables and Secrets**.

| Variable | Required | Example | Purpose |
|---|---:|---|---|
| `HF_TOKEN` | optional | `hf_...` | LLM research agent token (if using HF/OpenAI-compatible gateway) |
| `API_BASE_URL` | optional | `https://api.groq.com/openai/v1` | OpenAI-compatible base URL |
| `MODEL_NAME` | optional | `llama3-70b-8192` | Model name for research agent |
| `GROQ_API_KEY` | optional | `gsk_...` | If using Groq as the provider |
| `BLOCKCHAIN_ENABLED` | optional | `true/false` | Enable/disable on-chain logging |
| `RPC_URL` | optional | `https://rpc-amoy.polygon.technology` | Polygon Amoy RPC |
| `CHAIN_ID` | optional | `80002` | Polygon Amoy chain id |
| `PRIVATE_KEY` | optional | `0x...` | Signing key for on-chain audit writes |
| `CONTRACT_ADDRESS` | optional | `0x...` | Deployed audit contract address |
| `BACKEND_HTTP` | optional | `http://127.0.0.1:8000` | Streamlit → FastAPI base URL |
| `BACKEND_WS` | optional | `ws://127.0.0.1:8000` | Streamlit → WebSocket base URL |

> Notes:
> - The pipeline **does not crash** if LLM or blockchain vars are missing; it falls back safely for offline judging.
> - **Never commit `.env`** to a public repo or HF Space.

---

## Technical specs (TurboQuant)

### 17‑Dimensional Observation Space (state vector)

TurboQuant compresses the full credit state into a deterministic 17-signal vector (also used for hashing/audit proofs).

| # | Signal | Meaning |
|---:|---|---|
| 1 | `doc_completeness_pct` | Overall document completeness (0–100) |
| 2 | `step_count` | Agent step counter |
| 3 | `dscr` | Debt Service Coverage Ratio |
| 4 | `de_ratio` | Debt-to-equity ratio |
| 5 | `current_ratio` | Liquidity indicator |
| 6 | `interest_coverage` | Ability to service interest |
| 7 | `op_margin` | Operating margin (can be negative) |
| 8 | `circular_trading_flag` | Circular trading risk score/flag |
| 9 | `promoter_risk` | Promoter risk score |
| 10 | `litigation_risk` | Litigation risk score |
| 11 | `revenue_mismatch_flag` | Revenue mismatch between sources (0/1) |
| 12 | `sector_headwind` | Sector/regulatory headwind score |
| 13 | `gst_present` | GST doc present (0/1) |
| 14 | `itr_present` | ITR doc present (0/1) |
| 15 | `bank_stmt_present` | Bank statement present (0/1) |
| 16 | `annual_report_present` | Annual report present (0/1) |
| 17 | `mca_present` | MCA/filings present (0/1) |

### 12‑Action Space (policy actions)

For the demo, the agent operates on a 12-action set covering document requests, risk probes, and terminal recommendations.

| Action ID | Action | Intent |
|---:|---|---|
| 0 | `REQUEST_GST` | Ask for GST certificate |
| 1 | `REQUEST_ITR` | Ask for ITR filing |
| 2 | `REQUEST_BANK_STMT` | Ask for bank statement |
| 3 | `REQUEST_ANNUAL_REPORT` | Ask for annual report |
| 4 | `REQUEST_MCA_FILING` | Ask for MCA filing |
| 5 | `RUN_CIRCULAR_TRADING_CHECK` | Graph-based circular trading detection |
| 6 | `RUN_LITIGATION_SEARCH` | Search litigation / court flags |
| 7 | `RUN_PROMOTER_NEWS_SEARCH` | Promoter reputation/news risk |
| 8 | `RUN_SECTOR_RESEARCH` | Sector risk & macro headwinds |
| 9 | `RECOMMEND_APPROVE` | Terminal approve recommendation |
| 10 | `RECOMMEND_PARTIAL` | Terminal partial sanction |
| 11 | `RECOMMEND_REJECT` | Terminal reject recommendation |

---

## Audit proof (Polygon Amoy Explorer)

When blockchain logging is enabled, CreditSense anchors deterministic state hashes and decision events on-chain.

- **Contract explorer (Amoy)**: `https://amoy.polygonscan.com/address/<YOUR_CONTRACT_ADDRESS>`

Set `CONTRACT_ADDRESS` in HF Secrets and replace `<YOUR_CONTRACT_ADDRESS>` with your deployed address.

---

## Run with Docker (local)

```bash
docker build -t creditsense .
docker run --env-file .env -p 8000:8000 -p 8501:8501 creditsense
```

- Streamlit UI: `http://localhost:8501`
- FastAPI docs: `http://localhost:8000/docs`

---

## HuggingFace Spaces deployment

1. Create a new Space → choose **Docker**.
2. Upload/push this repo (with `Dockerfile` at the root).
3. Set Secrets in Space Settings:
   - `HF_TOKEN`, `API_BASE_URL`, `MODEL_NAME`
   - `PRIVATE_KEY`, `CONTRACT_ADDRESS`, `RPC_URL`
4. Wait for build → your live demo is ready.

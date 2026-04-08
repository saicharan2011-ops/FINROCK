<div align="center">
<!-- ANIMATED HEADER -->
<img src="https://capsule-render.vercel.app/api?type=waving&color=7F77DD&height=200&section=header&text=CreditSense%20AI&fontSize=60&fontColor=ffffff&animation=fadeIn&fontAlignY=38&desc=Autonomous%20Credit%20Appraisal%20for%20Indian%20Corporate%20Lending&descAlignY=60&descColor=5DCAA5" width="100%"/>
<!-- BADGES ROW 1 -->
<p>
  <img src="https://img.shields.io/badge/Meta%20×%20PyTorch-OpenEnv%20Hackathon-7F77DD?style=for-the-badge&logo=meta&logoColor=white"/>
  <img src="https://img.shields.io/badge/Hugging%20Face-Spaces%20Deployed-FFD21E?style=for-the-badge&logo=huggingface&logoColor=black"/>
  <img src="https://img.shields.io/badge/Polygon-Amoy%20Testnet-8247E5?style=for-the-badge&logo=polygon&logoColor=white"/>
</p>
<!-- BADGES ROW 2 -->
<p>
  <img src="https://img.shields.io/badge/Python-3.11-3776AB?style=for-the-badge&logo=python&logoColor=white"/>
  <img src="https://img.shields.io/badge/RL%20Framework-Gymnasium-FF6B35?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/LLM-Groq%20%2B%20Llama%203.1-00A3E0?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/Cost-₹0%20Spent-5DCAA5?style=for-the-badge"/>
</p>
<!-- ANIMATED TYPING -->
<br/>
╔══════════════════════════════════════════════════════════════╗
║  3 weeks of analyst work  →  40 seconds with CreditSense AI ║
║  ₹3–5 lakh per appraisal  →  ₹800 per appraisal             ║
║  Word doc audit trail     →  Blockchain-verified forever     ║
╚══════════════════════════════════════════════════════════════╝
<br/>
Built for the Meta × PyTorch OpenEnv Hackathon 2026 — India's Biggest AI Hackathon | $30,000 Prize Pool
🚀 Live Demo • 📄 OpenEnv Spec • 🔗 Blockchain Audit • 📊 Inference Script
</div>

🧠 What Is CreditSense AI?

Indian banks lose ₹32,000 crore a year to advance-related fraud. Not because they lack data — but because no system reads all of it together.

CreditSense AI is an autonomous credit appraisal agent built as a POMDP-based Reinforcement Learning environment (CreditAppraisalEnv-v1). It works exactly like a senior credit manager:

Sees partial information at the start (just a company name)
Decides which documents to request next — sequentially, under uncertainty
Investigates suspicious signals automatically (circular trading, shell networks, fake invoices)
Searches court records across 700+ Indian courts without any manual upload
Produces a complete Credit Appraisal Memo with an explainable recommendation
Writes every single decision permanently to the Polygon blockchain

This is not a batch processor. It is an agent that thinks.

## What judges should try (2 minutes)

1. Open the app UI (Streamlit) at `/:8501` and click **Create session**.
2. Upload any document(s) you have (even 1 is enough for demo).
3. Click **Run analysis via WebSocket** to stream agent logs live.
4. Download the generated **CAM (.docx)** and open the **Audit** metadata inside results.

Backend docs are available at `/:8000/docs`.

---──┘

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

<div align="center">
<img src="https://capsule-render.vercel.app/api?type=waving&color=5DCAA5&height=120&section=footer&animation=fadeIn" width="100%"/>
CreditSense AI — Built with ❤️ for India's banking system
Meta × PyTorch OpenEnv Hackathon 2026
</div>

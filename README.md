

---
title: CreditSense AI
emoji: 🧾
colorFrom: green
colorTo: gray
sdk: docker
app_port: 8501
pinned: false
---


<div align="center">

<!-- ANIMATED HEADER -->
<img src="https://capsule-render.vercel.app/api?type=waving&color=7F77DD&height=200&section=header&text=FINROCK%20AI&fontSize=60&fontColor=ffffff&animation=fadeIn&fontAlignY=38&desc=Autonomous%20Credit%20Appraisal%20for%20Indian%20Corporate%20Lending&descAlignY=60&descColor=5DCAA5" width="100%"/>

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

```
╔══════════════════════════════════════════════════════════════╗
║  3 weeks of analyst work  →  40 seconds with FINROCK ║
║  ₹3–5 lakh per appraisal  →  ₹800 per appraisal             ║
║  Word doc audit trail     →  Blockchain-verified forever     ║
╚══════════════════════════════════════════════════════════════╝
```

<br/>

**Built for the Meta × PyTorch OpenEnv Hackathon 2026 — India's Biggest AI Hackathon | $30,000 Prize Pool**

[🚀 Live Demo](https://huggingface.co/spaces/saicharan1907/FINROCK) • [📄 OpenEnv Spec](./openenv.yaml) • [🔗 Blockchain Audit](https://amoy.polygonscan.com/) • [📊 Inference Script](./inference.py)

</div>

---

## 🧠 What Is FINROCK?

> *Indian banks lose ₹32,000 crore a year to advance-related fraud. Not because they lack data — but because no system reads all of it together.*

**FINROCK** is an autonomous credit appraisal agent built as a **POMDP-based Reinforcement Learning environment** (`FINROCK`). It works exactly like a senior credit manager:

- Sees **partial information** at the start (just a company name)
- **Decides which documents to request** next — sequentially, under uncertainty
- **Investigates suspicious signals** automatically (circular trading, shell networks, fake invoices)
- **Searches court records** across 700+ Indian courts without any manual upload
- Produces a **complete Credit Appraisal Memo** with an explainable recommendation
- Writes **every single decision permanently to the Polygon blockchain**

This is not a batch processor. It is an agent that thinks.

---

## 🎯 The Problem — India's ₹32,000 Crore Blind Spot

<div align="center">

| The Old Way | FINROCK |
|---|---|
| 2–4 weeks per appraisal | **40 seconds** |
| ₹3–5 lakh analyst cost | **₹800 API cost** |
| 6+ analysts reading siloed data | **1 RL agent reading everything** |
| Word doc notes (deleted, lost) | **Blockchain audit trail forever** |
| Circular trading missed manually | **Detected automatically via graph cycles** |
| Court records: manual Google search | **700+ courts queried automatically** |
| RBI audit: "we can't show you why" | **Every step cryptographically replayable** |

</div>

> RBI's 2024-25 report: advance-related frauds = **over 90% of all banking fraud value**. FINROCK detects the 5 patterns behind India's biggest banking scandals — automatically.

---

## 🏗️ Architecture — The RL Environment

```
┌─────────────────────────────────────────────────────────────────┐
│                    CreditSenseAI-v1                     │
│                   (POMDP — Partially Observable)                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   OBSERVATION SPACE (what the agent sees)                       │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│   │ Doc complete │  │ Financial    │  │ Risk flags   │         │
│   │ flags [0/1]  │  │ ratios [f32] │  │ [0.0–1.0]    │         │
│   │ GST ITR Bank │  │ DSCR D/E ICR │  │ Circular     │         │
│   │ Report MCA   │  │ OpMargin CR  │  │ Litigation   │         │
│   └──────────────┘  └──────────────┘  │ Promoter     │         │
│                                       │ Sector       │         │
│   ┌──────────────┐                    └──────────────┘         │
│   │ Primary      │                                             │
│   │ insight score│  ← Credit officer's site visit notes        │
│   │ [0.0–1.0]    │                                             │
│   └──────────────┘                                             │
│                                                                 │
│   ACTION SPACE (12 discrete actions)                            │
│   ┌─────────────────────────────────────────────────────┐       │
│   │ COLLECT: request_gst, request_itr, request_bank,    │       │
│   │          request_annual_report, request_mca         │       │
│   │                                                     │       │
│   │ INVESTIGATE: run_circular_trading_check, litigation_ │       │
│   │   search, promoter_search, sector_research          │       │
│   │                                                     │       │
│   │ QUALIFY: site_visit_notes, mgmt_interview           │       │
│   │                                                     │       │
│   │ TERMINAL: recommend                                 │       │
│   └─────────────────────────────────────────────────────┘       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 💰 Reward Function — Partial Progress Signals

```python
# Every step gives feedback — not just at the end
REWARD_SIGNALS = {
    "correct_final_decision":        +1.00,   # vs ground truth
    "circular_trading_detected":     +0.20,   # before terminal
    "early_warning_flag_found":      +0.15,   # per flag
    "litigation_detected_early":     +0.15,
    "shell_network_found":           +0.15,
    "beneish_manipulation_flagged":  +0.15,
    "redundant_doc_request":         -0.05,   # already have it
    "premature_terminal_action":     -0.30,   # <60% doc complete
    "missed_litigation_in_cam":      -0.25,
    "wrong_final_decision":          -0.50,
}
```

---

## 🔍 5 Fraud Detection Capabilities

### 1. Circular Trading — Graph Cycle Detection
```python
import networkx as nx
# A→B→C→A invoice pattern = cycle in directed graph
cycles = list(nx.simple_cycles(invoice_graph))
# No bank in India does this automatically today
```

### 2. Shell Company Network
```
Director A ──── Company X
    │                │
Director B ──── Company Y ──── Company Z
    │                               │
Director A ─────────────────────────┘
# Same directors across 6 "independent" companies = shell network
```

### 3. Beneish M-Score — Financial Statement Manipulation
```
M = −4.84 + 0.92×DSRI + 0.528×GMI + 0.404×AQI + 0.892×SGI
        + 0.115×DEPI − 0.172×SGAI + 4.679×TATA − 0.327×LVGI
# Score > −2.22 → manipulation likely (catches Satyam-style fraud)
```

### 4. Invoice Discounting Fraud
- GSTIN validity check against government registry
- Round-number invoice detection (₹10,00,000 exactly — suspicious)
- Single-buyer concentration (>70% revenue from one buyer)

### 5. Loan Diversion
- Bank statement analysis post-loan-receipt
- Flags when >40% of funds leave to new beneficiaries within 15 days

---

## ⛓️ Blockchain Audit Trail — The World-First Feature

> *"Show us exactly why you approved this loan in 2021."*
> — RBI auditor, to every Indian bank, every year

Every RL agent action is written to **Polygon Amoy blockchain** via a 40-line Solidity contract:

```solidity
// CreditAudit.sol
contract CreditAudit {
    struct AuditEntry {
        bytes32 documentHash;    // SHA-256 of uploaded file
        string  actionTaken;     // e.g. "circular_trading_check"
        int256  rewardSignal;    // reward at this step
        uint256 timestamp;       // block timestamp
        address creditOfficer;   // who ran the appraisal
    }

    mapping(bytes32 => AuditEntry[]) public caseAuditTrail;

    event ActionLogged(bytes32 indexed caseId,
                       string action, uint256 timestamp);

    function logAction(bytes32 caseId, bytes32 docHash,
                       string memory action, int256 reward)
    external {
        caseAuditTrail[caseId].push(AuditEntry(
            docHash, action, reward,
            block.timestamp, msg.sender
        ));
        emit ActionLogged(caseId, action, block.timestamp);
    }
}
```

**Three things logged permanently:**
1. Document hash on arrival → tamper detection
2. Every agent action + reward → decision audit
3. Final CAM hash → provenance certificate

**This has never been built for banking anywhere in the world.**

---

## 📋 OpenEnv Spec Compliance

```yaml
# openenv.yaml
name: CreditAppraisalEnv-v1
version: "1.0.0"
description: >
  POMDP-based RL environment for Indian corporate credit appraisal.
  Agent sequentially requests documents, investigates fraud signals,
  and produces an explainable Credit Appraisal Memo.

observation_space:
  type: Dict
  fields:
    doc_completeness:    {type: Dict, keys: [gst, itr, bank, annual_report, mca]}
    financial_ratios:    {type: Dict, keys: [dscr, de_ratio, icr, current_ratio, operating_margin]}
    risk_flags:          {type: Dict, keys: [circular_trading, litigation_risk, promoter_risk, sector_headwind]}
    primary_insight_score: {type: float, range: [0.0, 1.0]}

action_space:
  type: Discrete
  n: 15
  actions:
    - request_gst            # 0
    - request_itr            # 1
    - request_bank           # 2
    - request_annual_report  # 3
    - request_mca            # 4
    - circular_trading_check # 5
    - litigation_search      # 6
    - promoter_search        # 7
    - shell_network_check    # 8
    - beneish_mscore         # 9
    - invoice_fraud_check    # 10
    - site_visit_notes       # 11
    - mgmt_interview         # 12
    - approve                # 13
    - reject                 # 14
    - partial                # 15

tasks:
  - id: task1_financial_extraction
    difficulty: easy
    description: Extract 5 financial ratios from GST + bank statement
    max_steps: 10
    passing_score: 0.7

  - id: task2_circular_trading
    difficulty: medium
    description: Detect planted A→B→C→A circular trading in GST invoices
    max_steps: 15
    passing_score: 0.7

  - id: task3_full_cam
    difficulty: hard
    description: Full pipeline — all doc types, planted fraud, site visit note, CAM output
    max_steps: 25
    passing_score: 0.6
```

---

## 🏃 Quickstart

```bash
# 1. Clone
git clone https://github.com/saicharan2011-ops/FINROCK.git
cd FINROCK

# 2. Install dependencies
pip install -r requirements.txt

# 3. Set environment variables
export API_BASE_URL="https://api.groq.com/openai/v1"
export MODEL_NAME="llama-3.1-8b-instant"
export HF_TOKEN="your_hf_token"
export GEMINI_API_KEY="your_gemini_key"         # free at aistudio.google.com

# 4. Run inference on all 3 tasks
python inference.py --task 1 --seed 42
python inference.py --task 2 --seed 42
python inference.py --task 3 --seed 42

# 5. Launch the Streamlit demo
streamlit run streamlit_app.py
```

---

## 📊 Baseline Scores

```
Reproducible with seed=42 across 5 consecutive runs:

Task 1 — Financial Extraction (Easy)
  Score: 0.84 / 1.0   ✅ PASS (threshold: 0.70)
  Steps: 6 / 10 max
  Key actions: request_gst → request_bank → approve

Task 2 — Circular Trading Detection (Medium)
  Score: 0.79 / 1.0   ✅ PASS (threshold: 0.70)
  Steps: 9 / 15 max
  Key action: circular_trading_check (+0.20 reward)
  Cycle found: GSTIN_A → GSTIN_B → GSTIN_C → GSTIN_A

Task 3 — Full CAM Generation (Hard)
  Score: 0.71 / 1.0   ✅ PASS (threshold: 0.60)
  Steps: 19 / 25 max
  Flags detected: circular_trading, litigation, promoter_risk
  Site visit note: "Factory at 40% capacity" → shifted to REJECT
  CAM generated: output/CAM_Phoenix_Steel_20260408.docx
```

---

## 🗂️ Project Structure

```
CreditSense-AI/
│
├── inference.py              ← Main hackathon script (OpenAI client → Groq)
├── credit_env.py             ← CreditAppraisalEnv-v1 (reset/step/state)
├── state_schema.py           ← Pydantic v2 shared state model
├── openenv.yaml              ← OpenEnv spec file
├── api.py                    ← FastAPI REST wrapper
│
├── parsers/
│   ├── pdf_parser.py         ← PyMuPDF + pdfplumber
│   ├── bank_parser.py        ← Pandas CSV parser
│   └── gst_itr_parser.py     ← JSON/XML parser
│
├── analysis/
│   ├── circular_trading.py   ← NetworkX graph cycle detection
│   ├── ratio_engine.py       ← DSCR, D/E, ICR, current ratio
│   ├── beneish_mscore.py     ← 8-ratio manipulation detector
│   └── invoice_fraud.py      ← GSTIN validity + round number check
│
├── agents/
│   ├── research_agent.py     ← Gemini API with web grounding
│   ├── promoter_scorer.py    ← Promoter background risk
│   └── sector_scorer.py      ← Sector headwind analysis
│
├── blockchain/
│   ├── CreditAudit.sol       ← Solidity smart contract (Polygon Amoy)
│   └── web3_logger.py        ← web3.py integration
│
├── output/
│   └── cam_generator.py      ← python-docx Five Cs CAM builder
│
├── streamlit_app.py          ← Full demo UI (4 screens)
├── test_data/                ← Synthetic Indian company scenarios
├── tasks/                    ← task1.yaml, task2.yaml, task3.yaml
├── Dockerfile
└── requirements.txt
```

---

## 🖥️ Tech Stack

<div align="center">

| Layer | Technology | Why |
|---|---|---|
| RL Environment | Python + Gymnasium + Pydantic v2 | OpenEnv spec compliance |
| LLM Agent | Groq + Llama 3.1 8B (free) | OpenAI-compatible, fast inference |
| PDF Parsing | PyMuPDF + pdfplumber | Handles corrupt Indian PDFs |
| Graph Fraud | NetworkX `simple_cycles()` | Circular trading in one line |
| Web Research | Gemini 1.5 Flash (free) | 1M tokens/day, web grounding |
| Blockchain | Web3.py + Solidity + Polygon Amoy | Free testnet, permanent audit |
| Court Records | Kleopatra Court API | 700+ Indian courts, free tier |
| CAM Output | python-docx | Professional Word document |
| UI | Streamlit | Fast to build, clean demo |
| Deployment | Docker + HuggingFace Spaces | Free, required by hackathon |

**Total infrastructure cost: ₹0**

</div>

---

## 🔒 Security Architecture

```
Layer 1 — Encryption at Rest
  AES-128-CBC on all uploaded files (cryptography library)
  Original files deleted immediately after extraction
  Only ratios and risk scores retained in memory

Layer 2 — Blockchain Integrity
  SHA-256 hash written on-chain at document upload
  Any file tampering → hash mismatch → instant detection
  Immutable Polygon Amoy record (cannot be deleted)

Layer 3 — Data Minimisation
  All encrypted files purged after CAM generation
  No PII stored beyond the current session
  Production path: AES-256-GCM + AWS KMS documented in README
```

---

## 🗺️ 7-Day Build Plan

```
Day 1  ─── state_schema.py (together) + env skeleton + synthetic data
Day 2  ─── Reward function (8 signals, 10 unit tests) + task YAMLs + parsers
Day 3  ─── Solidity deploy + web3_logger + pdf_parser + research_agent
Day 4  ─── openenv.yaml + api.py + first full integration test
Day 5  ─── inference.py complete + reproducibility verified (5 runs)
Day 6  ─── Dockerfile + HuggingFace deploy + Streamlit UI complete
Day 7  ─── Demo rehearsal
```

---

## 👥 Team

<div align="center">

| | Role | Owns |
|---|---|---|
| **Teammate 1** | RL Core + Blockchain | `inference.py`, `credit_env.py`, `state_schema.py`, `web3_logger.py`, `CreditAudit.sol`, `openenv.yaml`, `api.py`, task YAMLs, Dockerfile |
| **Teammate 2** | Parsers + UI | `pdf_parser.py`, `bank_parser.py`, `gst_itr_parser.py`, `circular_trading.py`, `research_agent.py`, `cam_generator.py`, `streamlit_app.py`, test data |

</div>

---

<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=5DCAA5&height=120&section=footer&animation=fadeIn" width="100%"/>

**CreditSense AI** — Built with ❤️ for India's banking system

*Meta × PyTorch OpenEnv Hackathon 2026*

</div>

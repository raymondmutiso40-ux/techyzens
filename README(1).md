# BidDesk AI — Autonomous Bid Intelligence System

> **"A bid desk that reads every tender, so your team can write the winning ones."**  
> *Architecture based on Sharahbiil Abdi's BD Intelligence System (October 2026).*

---

## 🎯 System Philosophy & Core Mandate

```
Find the tender ➔ Extract the TOR ➔ Score the fit ➔ Match the team ➔ Draft the proposal ➔ Check every claim ➔ Email the review pack
...and then it stops. A person reviews and submits. Humans own the last mile.
```

The system is engineered to automate everything up to the draft stage. **It never auto-submits bids.** A human must review, edit, decide whether to bid, and submit.

---

## 🏗️ Architecture: The 7 Moves

| Move | Name | Description | Output / Where It Lives |
|:---:|:---|:---|:---|
| **1** | **Find** | Watches tender portals and donor sites on a schedule via source adapters. | Raw Notice in Storage / Tenders Table |
| **2** | **Extract** | Pulls the TOR: scope, deadlines, budget, eligibility, evaluation criteria. | Structured TOR Record |
| **3** | **Score** | Fit score out of 100 with bid/no-bid recommendation and reasons. | Score Record + Thrivewave SMS alert |
| **4** | **Match** | Semantic vector search ranking team CVs & past proposals by fit. | Team Shortlist & Citations |
| **5** | **Draft** | Compiles Microsoft Word (`.docx`) technical proposal or EOI. | Draft Package (`.docx`) |
| **6** | **Check** | Traces each claim to evidence; flags compliance gaps. | Grounding Evidence Table |
| **7** | **Send** | Emails Review Pack to the bid lead + dispatches Thrivewave SMS. | Audit Log + Notification Sent |
| **STOP** | **Decide** | **The pipeline stops.** Human reviewer logs in, reviews, edits, and decides. | Human Signoff Record |

---

## 🛡️ Slide 8: Safety & Human Control Principles

1. **No Auto-Submit:** Strict state machine prevents automated submissions. Bids transition from `UNDER_HUMAN_REVIEW` only when a person triggers `APPROVED_TO_BID` or `SUBMITTED_BY_HUMAN`.
2. **Spend Caps & Tripwires:** Daily ($50.00 default) and per-tender ($5.00 default) token spend limits with automated tripwires and Thrivewave SMS warnings at 80% usage.
3. **Untrusted Documents:** Tender notices and uploads are treated strictly as untrusted data. Input text is sanitized to defang prompt injections (`PromptGuard`) and enclosed in isolated XML data blocks.
4. **Grounded Claims:** Every factual claim in generated proposals is cross-referenced against verified CVs and past proposals. Unsupported assertions are flagged in amber for human verification.
5. **Audit Log:** Every step, LLM interaction, and human decision is immutably logged with input/output hashes.
6. **Thrivewave SMS & Rumptycloud Managed DB:** Instant SMS alerts for high-fit bids ($\ge 70/100$) and seamless PostgreSQL deployment on Rumptycloud.

---

## 📁 Repository Structure

```
bid-desk-backend/
├── app/
│   ├── core/
│   │   ├── config.py              # Pydantic Settings & environment config
│   │   ├── database.py            # Async SQLAlchemy engine & sessionmaker
│   │   ├── prompt_guard.py        # Untrusted document sanitizer & injection defense
│   │   ├── spend_guard.py         # Daily & per-tender spend limits and tripwires
│   │   └── audit.py               # Immutable step-by-step audit logger
│   ├── models/
│   │   ├── entities.py            # SQLAlchemy models (Tenders, TOR, Score, Drafts, etc.)
│   │   └── schemas.py             # Pydantic v2 validation and response schemas
│   ├── adapters/
│   │   ├── base.py                # BaseSourceAdapter interface
│   │   ├── ungm_adapter.py        # UN Global Marketplace (UNGM/UNDP) adapter
│   │   ├── world_bank_adapter.py  # World Bank procurement adapter
│   │   ├── email_adapter.py       # Inbound email alert monitor
│   │   ├── upload_adapter.py      # Manual file intake (.docx, .pdf, .md, .txt)
│   │   └── manager.py             # Adapter registry, scheduler & retries
│   ├── services/
│   │   ├── vector_store.py        # In-memory cosine vector store for CVs & proposals
│   │   ├── llm_provider.py        # Unified client (Claude, Gemini, OpenAI, Mock)
│   │   ├── thrivewave_sms.py      # Thrivewave SMS client for time-critical alerts
│   │   ├── extractor.py           # Move 2: Structured TOR extractor
│   │   ├── scorer.py              # Move 3: 0-100 fit scorer & bid/no-bid engine
│   │   ├── matcher.py             # Move 4: Semantic CV & past performance matcher
│   │   ├── drafting.py            # Move 5: Technical proposal generator
│   │   ├── docx_builder.py        # Microsoft Word (.docx) styling and compilation
│   │   ├── grounding.py           # Move 6: Claim evidence tracer & compliance audit
│   │   ├── email_notifier.py      # Move 7: Review pack email & notification dispatcher
│   │   └── orchestrator.py        # Master 7-move pipeline orchestrator
│   ├── api/
│   │   ├── v1/                    # REST endpoints (tenders, pipeline, reviews, spend, etc.)
│   │   └── router.py              # Unified API router
│   └── main.py                    # FastAPI application, CORS, static mounting
├── mockups/
│   ├── tenders/                   # Realistic sample TORs (Markdown & .docx)
│   ├── cvs/                       # Realistic team CVs (Dr. Amina Kadir, Marcus Chen, etc.)
│   ├── past_proposals/            # Past winning proposal precedents
│   └── templates/                 # Word proposal and EOI templates (.docx)
├── scripts/
│   ├── generate_mock_docs.py      # Generates sample TORs, CVs, and templates
│   ├── seed_database.py           # Seeds database with team, past proposals, demo tenders
│   └── run_demo_pipeline.py       # Runs the complete 7 moves end-to-end
├── static/
│   └── index.html                 # Complete interactive BidDesk UI dashboard
├── tests/                         # Pytest test suite (9 tests, 100% pass)
├── Dockerfile                     # Production container spec
├── docker-compose.yml             # Local Docker + PostgreSQL compose file
└── requirements.txt               # Frozen dependencies
```

---

## 🚀 Quickstart Guide

### 1. Prerequisites & Virtual Environment
```bash
cd /home/sama/.gemini/antigravity/scratch/bid-desk-backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 2. Generate Mockup Documents
```bash
python scripts/generate_mock_docs.py
```
This generates realistic donor RFPs, team CVs, past winning proposals, and Microsoft Word templates inside `mockups/`.

### 3. Seed the Database
```bash
PYTHONPATH=. python scripts/seed_database.py
```

### 4. Run the 7-Step Pipeline Demo (CLI)
```bash
PYTHONPATH=. python scripts/run_demo_pipeline.py
```
This runs Moves 1 through 7 on the seeded UNDP tender, writes a Microsoft Word `.docx` technical proposal, checks claims, sends the review pack, and stops for human approval.

### 5. Launch the Server & Interactive Web Dashboard
```bash
PYTHONPATH=. uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
Open your browser at:
- **Interactive Dashboard:** `http://localhost:8000/` or `http://localhost:8000/dashboard`
- **Interactive OpenAPI Docs:** `http://localhost:8000/docs`

---

## 🧪 Running Automated Tests
```bash
PYTHONPATH=. pytest tests -v
```
All 9 unit and integration tests will run and pass:
- Prompt injection protection & untrusted document defenses
- Daily and per-tender spend caps
- Thrivewave SMS dispatch
- All 7 pipeline moves (Extract, Score, Match, Draft, Docx, Check, Send)
- Human decision signoff gate
- REST API endpoints

---

## ☁️ Rumptycloud & Production Deployment

### 1. Database Connection
Rumptycloud provides a managed PostgreSQL database. Configure these environment variables in your Rumptycloud dashboard:
```env
DATABASE_URL=postgresql+asyncpg://<user>:<password>@<rumptycloud-host>:5432/<database_name>
SYNC_DATABASE_URL=postgresql://<user>:<password>@<rumptycloud-host>:5432/<database_name>
```
On application startup, `app.core.database.init_db()` automatically provisions all tables on your Rumptycloud database.

### 2. Thrivewave SMS Integration
Add your Thrivewave API credentials:
```env
ENABLE_SMS_ALERTS=true
THRIVEWAVE_API_KEY=your_production_api_key_here
THRIVEWAVE_SENDER_ID=BIDDESK
THRIVEWAVE_API_URL=https://api.thrivewave.com/v1/sms/send
BID_LEAD_PHONE=+1234567890
```

### 3. Deploy via Docker
Deploy directly to Rumptycloud using the included production `Dockerfile`:
```bash
docker build -t biddesk-backend .
docker run -p 8000:8000 --env-file .env biddesk-backend
```

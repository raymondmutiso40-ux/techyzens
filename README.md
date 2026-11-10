# TenderPilot

Tender discovery and proposal drafting for business development teams at consultancies bidding on UN and World Bank tenders. The live dashboard is at [techyzens.rumptycloud.app/dashboard](https://techyzens.rumptycloud.app/dashboard).

## How it works

Tender notices enter through the UNGM and World Bank Procurement adapters (or a manual TOR upload). TenderPilot extracts requirements, scores fit, records a human go/no-go decision, matches team evidence, drafts and checks a proposal, and records submission outcomes. A person remains responsible for the bid decision and submission.

## Fit score methodology

The backend scorer (`app/services/scorer.py`) asks the configured language model to assess the tender title, donor, budget, deadline, country, TOR summary, required skills, mandatory requirements, and evaluation criteria against the firm's stated capabilities. It requests a 0–100 fit score, capability-fit and strategic-alignment sub-scores, compliance risk, pros, risks, and disqualifiers. **There are no fixed factor weights or arithmetic formula in the code.** Scores are model-generated; malformed output currently falls back to a score of 75.

## Setup and run

Requirements: Python 3.12+, Node.js 20+, npm.

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # optional; defaults support local SQLite and mock AI
cd tenderpilot/frontend && npm ci
```

In one terminal, from the repository root:

```bash
PYTHONPATH=. uvicorn app.main:app --reload --port 8000
```

In another terminal:

```bash
cd tenderpilot/frontend && npm run dev
```

The Vite development server proxies `/api` to `http://127.0.0.1:8000`. Set `DATABASE_URL` and `SYNC_DATABASE_URL` for the database (SQLite defaults are local); `LLM_PROVIDER` and the matching `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`, or `OTARI_API_KEY` for a hosted model; `FIT_THRESHOLD_SCORE` for the fallback decision threshold; `EMAIL_PROVIDER` plus `RESEND_API_KEY` or SMTP settings for email; and `ENABLE_SMS_ALERTS`, `THRIVEWAVE_API_KEY`, and `BID_LEAD_PHONE` for SMS. See `.env.example` for all supported variables and defaults.


### Otari.ai (open-weight and hosted models)

TenderPilot can route scoring, extraction, and proposal generation through Otari's OpenAI-compatible Chat Completions API. Configure these variables in your deployment's secret/environment settings:

```dotenv
LLM_PROVIDER=otari
OTARI_API_KEY=your_otari_api_key
OTARI_BASE_URL=https://api.otari.ai/api
OTARI_MODEL=provider:model-id
```

Use the exact model identifier shown in your Otari account or `GET https://api.otari.ai/api/v1/models`; model identifiers are gateway/provider-specific. Choose an open-weight model if required by the hackathon. Do not commit API keys. The provider sends requests to `{OTARI_BASE_URL}/v1/chat/completions`, enforces the existing local spend guard, and records Otari's `usage.cost_usd` when the gateway returns it. If `LLM_PROVIDER=otari` is selected but the key or model is missing, TenderPilot safely uses its deterministic mock provider.

## Testing

```bash
cd tenderpilot/frontend
npm test
npm run build
```

The frontend regression suite covers dashboard actions, tender intake, API mapping, and tender logic. Current verification on `final-polish`: **42 tests passed across 9 files; `npm run build` passed.** Backend tests can be run with `PYTHONPATH=. pytest tests -v` from the repository root.

## Known limitations and failure cases

- Live portal availability, scraping, and source coverage depend on the adapters and external sites; the dashboard also includes local sample data.
- Dashboard actions persist locally first. If the API is unreachable, a device-local save remains and the UI reports the failed server sync.
- AI fit scores are not calibrated against historical wins and have no declared factor weights. Review the evidence and score before deciding.
- Proposal drafts can contain unsupported or incomplete details; human review and submission are required.

## What's left to polish

- Add integration tests for live API decision and outcome persistence.
- Validate adapter freshness and field coverage against current UNGM and World Bank notices.
- Add calibration and source citations for fit scores.
- Improve dashboard recovery when stored local data is malformed.

## AI usage

OpenAI Codex assisted with this polish pass and generated code and documentation. Changes were checked with the frontend test suite, production build, and an interactive dashboard test covering approval and outcome logging. No user feedback or impact figures are claimed.

## Tech stack and event tools used

React, TypeScript, Vite, Tailwind CSS, and Vitest power the frontend; Python, FastAPI, Pydantic, and SQLAlchemy power the API. Storage defaults to SQLite with PostgreSQL support through configuration. UNGM and World Bank Procurement adapters provide tender sources. GitHub Actions runs frontend tests and a build on pushes and pull requests. No product analytics or event-tracking service is configured.

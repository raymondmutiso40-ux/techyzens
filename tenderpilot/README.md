# TenderPilot

An AI agent that finds relevant tenders, scores how well they fit your firm, and drafts the technical proposal.

> Working name. Full requirements are in [`docs/PRD.md`](docs/PRD.md).

## What it does

1. **Knowledge Base**: CVs, past proposals, and capability statements in one searchable place.
2. **Tender Discovery**: monitors selected tender sources (starting with UN) filtered by sector, region, and keywords.
3. **Tender Fit Ranking**: scores each tender with a short explanation.
4. **Proposal Drafting**: generates a technical proposal grounded in the firm's own documents.
5. **Review and Export**: edit, approve, and export to Word/PDF.

## Repo structure

```
tenderpilot/
├── docs/        # PRD and planning
├── frontend/    # Frontend app
├── backend/     # Backend API and agent
└── README.md
```

## Authentication

SMS one-time-code login via the Thrivewave API. See [`docs/AUTH.md`](docs/AUTH.md).

## Status

Planning. MVP scope is defined in the PRD.

## Stack

- Frontend: _to be filled in_
- Backend: _to be filled in_
- SMS login: Thrivewave API

Copy `.env.example` to `.env` and fill in the values.

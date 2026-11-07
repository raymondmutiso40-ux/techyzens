# Product Requirements Document

## Product

TenderPilot *(working name)*: an AI agent that finds relevant tenders, scores how well they fit your firm, and drafts the technical proposal.

## Problem

Consultancy firms lose days and significant money on the tender process:

- Staff constantly monitor tender portals (e.g. UN procurement sites) for new opportunities, and relevant ones are easy to miss.
- Once a tender is found, someone manually judges whether the firm is a good fit by checking it against the organization's capabilities and consultant CVs.
- A technical proposal is then written from scratch, following the format the tender requires and borrowing from past proposals.

Every step depends on human effort, so the process is slow, expensive, and inconsistent. Firms spend time on tenders they are unlikely to win, and good opportunities are missed or answered too late.

## Target Users

- **Primary:** Business development and proposal teams at small to mid-sized consultancy firms.
- **Secondary:** Directors and partners who decide which tenders to pursue (the go/no-go decision).

## Goal

Cut the time and cost from "tender published" to "proposal ready for review" from days to hours, while keeping humans in control of what gets submitted.

## Core Features

1. **Knowledge Base:** the firm's CVs, past proposals, and capability statements in one searchable place.
2. **Tender Discovery:** continuous monitoring of selected tender sources, filtered by the firm's sectors, regions, and keywords.
3. **Tender Fit Ranking:** each tender scored against the firm's capabilities and available consultants, with a short explanation for the score.
4. **Proposal Drafting:** a technical proposal draft built from the tender requirements, the firm's preferred format, and relevant past work.
5. **Review and Export:** the team can edit the draft, approve it, and export it for submission.

## MVP

- Firm uploads CVs, past proposals, and capability documents
- Firm sets preferences: sectors, regions, keywords, and tender sources to watch
- Agent monitors at least one tender source (e.g. UN) and lists new matching tenders
- Agent ranks tenders with a fit score and a short reason
- User selects a tender and the agent generates a draft technical proposal
- Draft follows the tender's stated requirements and the firm's preferred proposal structure
- Draft reuses relevant content and consultant profiles from the knowledge base
- User can edit the draft and export it (Word/PDF)

## Out of Scope

- Submitting proposals to tender portals automatically
- Financial proposals, pricing, and budgeting
- Contract negotiation and post-award project management
- Bid/no-bid decisions made without a human
- Team collaboration features such as comments and approvals
- Mobile app
- Support for many tender sources beyond the initial one or two

## Success Criteria

A user should be able to:

1. Upload their firm's CVs and past proposals
2. Set their tender preferences
3. See a list of newly published, relevant tenders without searching manually
4. View a fit score with a clear reason for each tender
5. Generate a technical proposal draft for a chosen tender
6. Edit the draft and export it for submission

The product is succeeding when:

- Time to a first proposal draft drops from days to under a day
- Most tenders surfaced are judged relevant by the firm
- Proposal teams need only light editing, not a rewrite, to finalize a draft
- Every claim in a draft traces back to the firm's own documents, so nothing is invented

## Open Questions

- Which tender sources matter most for the first customers?
- What file formats do firms hold their CVs and past proposals in?
- How much editing do firms accept before a draft stops saving them time?

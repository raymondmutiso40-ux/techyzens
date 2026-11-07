from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models.entities import Tender, ProposalDraft, ClaimEvidence, ReviewPack, TenderScore
from app.models.schemas import HumanDecisionRequest, ProposalDraftUpdate
from app.services.docx_builder import DocxProposalBuilder
from app.services.orchestrator import PipelineOrchestrator
from app.core.audit import AuditLogger

router = APIRouter(prefix="/reviews", tags=["Human Review Desk"])

@router.get("/{tender_id}")
async def get_tender_review_dashboard(tender_id: str, db: AsyncSession = Depends(get_db)):
    """
    Returns the complete review desk package for human sign-off:
    - Score & rationale
    - Team shortlist
    - Proposal draft sections
    - Grounding evidence & audit flags
    """
    res = await db.execute(
        select(Tender)
        .options(
            selectinload(Tender.tor),
            selectinload(Tender.score),
            selectinload(Tender.drafts).selectinload(ProposalDraft.claims),
            selectinload(Tender.review_packs)
        )
        .where(Tender.id == tender_id)
    )
    tender = res.scalar_one_or_none()
    if not tender:
        raise HTTPException(status_code=404, detail="Tender not found")

    draft = tender.drafts[-1] if tender.drafts else None
    review_pack = tender.review_packs[-1] if tender.review_packs else None

    return {
        "tender": {
            "id": tender.id,
            "title": tender.title,
            "donor": tender.donor,
            "status": tender.status,
            "deadline": tender.deadline,
            "budget": tender.budget
        },
        "score": tender.score,
        "draft": draft,
        "claims": draft.claims if draft else [],
        "review_pack": review_pack,
        "governance_notice": "Humans own the last mile. The system never submits anything on its own."
    }

@router.put("/{tender_id}/draft")
async def update_draft_by_human(
    tender_id: str,
    draft_update: ProposalDraftUpdate,
    editor_name: str = "Bid Lead",
    db: AsyncSession = Depends(get_db)
):
    """
    Allows human reviewers to edit proposal draft narrative sections.
    Recompiles the Word .docx file with the human edits and logs the audit event.
    """
    res = await db.execute(
        select(ProposalDraft)
        .where(ProposalDraft.tender_id == tender_id)
        .order_by(ProposalDraft.version.desc())
    )
    draft = res.scalar_one_or_none()
    if not draft:
        raise HTTPException(status_code=404, detail="No proposal draft found to edit.")

    # Apply edits
    if draft_update.executive_summary is not None:
        draft.executive_summary = draft_update.executive_summary
    if draft_update.context_understanding is not None:
        draft.context_understanding = draft_update.context_understanding
    if draft_update.technical_methodology is not None:
        draft.technical_methodology = draft_update.technical_methodology
    if draft_update.work_plan_deliverables is not None:
        draft.work_plan_deliverables = draft_update.work_plan_deliverables
    if draft_update.past_performance is not None:
        draft.past_performance = draft_update.past_performance
    if draft_update.human_notes is not None:
        draft.human_notes = draft_update.human_notes

    draft.is_human_edited = True

    # Fetch tender & tor to recompile docx
    t_res = await db.execute(
        select(Tender).options(selectinload(Tender.tor)).where(Tender.id == tender_id)
    )
    tender = t_res.scalar_one()

    if draft.docx_file_path:
        DocxProposalBuilder.generate_docx(
            draft=draft,
            tender=tender,
            tor=tender.tor,
            output_path=draft.docx_file_path
        )

    await db.commit()
    await db.refresh(draft)

    await AuditLogger.log_step(
        db=db,
        step_name="HUMAN_EDIT",
        action=f"Proposal draft v{draft.version} edited by human: {editor_name}",
        actor=f"HUMAN: {editor_name}",
        tender_id=tender.id,
        details={"human_notes": draft.human_notes, "file": draft.docx_file_path}
    )

    return {"message": "Draft updated and Word .docx recompiled with human edits.", "draft": draft}

@router.post("/{tender_id}/decision")
async def record_human_bid_decision(
    tender_id: str,
    decision_req: HumanDecisionRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Final human decision gate.
    Choices: 'APPROVED_TO_BID', 'REJECTED', 'REVISE', 'SUBMITTED_BY_HUMAN'.
    Triggers Thrivewave SMS alert and permanent audit log entry.
    """
    try:
        result = await PipelineOrchestrator.record_human_decision(
            db=db,
            tender_id=tender_id,
            decision=decision_req.decision,
            reviewer_name=decision_req.reviewer_name,
            reviewer_email=decision_req.reviewer_email,
            comments=decision_req.comments
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

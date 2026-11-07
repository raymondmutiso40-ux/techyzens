from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models.entities import Tender, ProposalDraft
from app.services.extractor import TORExtractor
from app.services.scorer import TenderScorer
from app.services.matcher import TeamMatcher
from app.services.drafting import ProposalDrafter
from app.services.grounding import GroundingChecker
from app.services.email_notifier import ReviewPackNotifier

router = APIRouter(prefix="/pipeline", tags=["Pipeline Moves"])

async def get_tender_or_404(db: AsyncSession, tender_id: str) -> Tender:
    res = await db.execute(
        select(Tender)
        .options(
            selectinload(Tender.tor),
            selectinload(Tender.score),
            selectinload(Tender.drafts)
        )
        .where(Tender.id == tender_id)
    )
    tender = res.scalar_one_or_none()
    if not tender:
        raise HTTPException(status_code=404, detail="Tender not found")
    return tender

@router.post("/{tender_id}/extract")
async def run_move_extract(tender_id: str, db: AsyncSession = Depends(get_db)):
    """Move 2: Extract TOR parameters from document notice."""
    tender = await get_tender_or_404(db, tender_id)
    tor = await TORExtractor.extract_tor(db, tender)
    return {"message": "Move 2 (Extract) complete", "tor": tor}

@router.post("/{tender_id}/score")
async def run_move_score(tender_id: str, db: AsyncSession = Depends(get_db)):
    """Move 3: Score fit out of 100 with bid/no-bid rationale."""
    tender = await get_tender_or_404(db, tender_id)
    if not tender.tor:
        raise HTTPException(status_code=400, detail="TOR has not been extracted yet. Run /extract first.")
    score = await TenderScorer.score_tender(db, tender, tender.tor)
    return {"message": "Move 3 (Score) complete", "score": score}

@router.post("/{tender_id}/match")
async def run_move_match(tender_id: str, db: AsyncSession = Depends(get_db)):
    """Move 4: Rank team CVs and past proposals against required expertise."""
    tender = await get_tender_or_404(db, tender_id)
    if not tender.tor:
        raise HTTPException(status_code=400, detail="TOR required. Run /extract first.")
    match_data = await TeamMatcher.match_team_and_proposals(db, tender, tender.tor)
    return {"message": "Move 4 (Match) complete", "matches": match_data}

@router.post("/{tender_id}/draft")
async def run_move_draft(tender_id: str, template_type: str = "TECHNICAL_PROPOSAL", db: AsyncSession = Depends(get_db)):
    """Move 5: Generate Word technical proposal draft."""
    tender = await get_tender_or_404(db, tender_id)
    if not tender.tor:
        raise HTTPException(status_code=400, detail="TOR required. Run /extract first.")
    match_data = await TeamMatcher.match_team_and_proposals(db, tender, tender.tor)
    draft = await ProposalDrafter.generate_draft(db, tender, tender.tor, match_data, template_type)
    return {"message": "Move 5 (Draft) complete", "draft": draft}

@router.post("/{tender_id}/check")
async def run_move_check(tender_id: str, db: AsyncSession = Depends(get_db)):
    """Move 6: Conduct claim grounding and compliance check."""
    tender = await get_tender_or_404(db, tender_id)
    if not tender.drafts:
        raise HTTPException(status_code=400, detail="Draft required. Run /draft first.")
    draft = tender.drafts[-1]
    claims = await GroundingChecker.verify_claims_and_compliance(db, tender, tender.tor, draft)
    return {"message": "Move 6 (Check) complete", "claims_count": len(claims)}

@router.post("/{tender_id}/send")
async def run_move_send(tender_id: str, db: AsyncSession = Depends(get_db)):
    """Move 7: Send review pack to bid lead and trigger Thrivewave SMS."""
    tender = await get_tender_or_404(db, tender_id)
    if not tender.score or not tender.drafts:
        raise HTTPException(status_code=400, detail="Score and draft required before sending review pack.")
    draft = tender.drafts[-1]
    pack = await ReviewPackNotifier.assemble_and_send_review_pack(db, tender, tender.score, draft)
    return {"message": "Move 7 (Send) complete. Status transitioned to UNDER_HUMAN_REVIEW.", "review_pack": pack}

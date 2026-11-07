import logging
from typing import Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.models.entities import Tender, TenderTOR, TenderScore, ProposalDraft, ReviewPack
from app.services.extractor import TORExtractor
from app.services.scorer import TenderScorer
from app.services.matcher import TeamMatcher
from app.services.drafting import ProposalDrafter
from app.services.grounding import GroundingChecker
from app.services.email_notifier import ReviewPackNotifier
from app.services.thrivewave_sms import thrivewave_client
from app.core.spend_guard import spend_guard
from app.core.audit import AuditLogger

logger = logging.getLogger(__name__)

class PipelineOrchestrator:
    """
    Orchestrates the 7 Moves from Tender Notice to Review-Ready Draft:
    1 Find
    2 Extract
    3 Score
    4 Match
    5 Draft
    6 Check
    7 Send
    ...and then it stops. A person reviews and submits.
    """

    @classmethod
    async def run_full_pipeline(
        cls,
        db: AsyncSession,
        tender_id: str,
        template_type: str = "TECHNICAL_PROPOSAL",
        recipient_email: Optional[str] = None,
        recipient_phone: Optional[str] = None
    ) -> Dict[str, Any]:
        logger.info(f"Starting 7-Move Pipeline for Tender ID: {tender_id}")

        res = await db.execute(
            select(Tender)
            .options(
                selectinload(Tender.tor),
                selectinload(Tender.score),
                selectinload(Tender.drafts),
                selectinload(Tender.review_packs)
            )
            .where(Tender.id == tender_id)
        )
        tender = res.scalar_one_or_none()
        if not tender:
            raise ValueError(f"Tender {tender_id} not found.")

        # --- MOVE 1: FIND (Notice already collected/uploaded) ---
        await AuditLogger.log_step(
            db=db,
            step_name="FIND",
            action="Tender opportunity identified and queued for processing",
            tender_id=tender.id,
            details={"title": tender.title, "source": tender.source_name, "donor": tender.donor}
        )

        # --- MOVE 2: EXTRACT ---
        tor = await TORExtractor.extract_tor(db=db, tender=tender)

        # --- MOVE 3: SCORE ---
        score = await TenderScorer.score_tender(db=db, tender=tender, tor=tor)

        # Dispatch Thrivewave SMS alert if high-fit
        if score.fit_score >= 70 and score.bid_decision == "BID":
            await thrivewave_client.notify_high_fit_tender(
                tender_title=tender.title,
                fit_score=score.fit_score,
                bid_decision=score.bid_decision,
                donor=tender.donor,
                phone=recipient_phone
            )

        # --- MOVE 4: MATCH ---
        match_data = await TeamMatcher.match_team_and_proposals(db=db, tender=tender, tor=tor)

        # --- MOVE 5: DRAFT ---
        draft = await ProposalDrafter.generate_draft(
            db=db,
            tender=tender,
            tor=tor,
            match_data=match_data,
            template_type=template_type
        )

        # --- MOVE 6: CHECK ---
        claims = await GroundingChecker.verify_claims_and_compliance(
            db=db,
            tender=tender,
            tor=tor,
            draft=draft
        )

        # --- MOVE 7: SEND ---
        review_pack = await ReviewPackNotifier.assemble_and_send_review_pack(
            db=db,
            tender=tender,
            score=score,
            draft=draft,
            claims=claims,
            recipient_email=recipient_email,
            recipient_phone=recipient_phone
        )

        # --- AND THEN IT STOPS ---
        # The pipeline deliberately ends here. Human owns the last mile.
        logger.info(f"Pipeline complete for {tender.id}. Status: {tender.status}. Ready for human review.")

        spend_stats = spend_guard.get_status(tender_id=tender.id)

        return {
            "tender_id": tender.id,
            "title": tender.title,
            "status": tender.status,
            "fit_score": score.fit_score,
            "bid_decision": score.bid_decision,
            "team_shortlist_count": len(match_data.get("team_shortlist", [])),
            "claims_total": len(claims),
            "claims_flagged": sum(1 for c in claims if not c.is_grounded),
            "docx_path": draft.docx_file_path,
            "review_pack_id": review_pack.id,
            "spend_summary": spend_stats,
            "governance_rule": "The system stops at a draft. A human reviews and submits."
        }

    @classmethod
    async def record_human_decision(
        cls,
        db: AsyncSession,
        tender_id: str,
        decision: str,
        reviewer_name: str,
        reviewer_email: str,
        comments: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Implements Slide 1, 2, 8:
        'A person reviews and submits. Humans own the last mile.'
        """
        valid_decisions = ["APPROVED_TO_BID", "REJECTED", "REVISE", "SUBMITTED_BY_HUMAN"]
        if decision not in valid_decisions:
            raise ValueError(f"Invalid decision '{decision}'. Must be one of {valid_decisions}")

        res = await db.execute(select(Tender).where(Tender.id == tender_id))
        tender = res.scalar_one_or_none()
        if not tender:
            raise ValueError(f"Tender {tender_id} not found.")

        old_status = tender.status
        tender.status = decision
        await db.commit()
        await db.refresh(tender)

        await AuditLogger.log_step(
            db=db,
            step_name="HUMAN_DECISION",
            action=f"Human reviewer ({reviewer_name}) recorded decision: {decision}",
            actor=f"HUMAN: {reviewer_name} <{reviewer_email}>",
            tender_id=tender.id,
            details={
                "previous_status": old_status,
                "new_status": decision,
                "comments": comments or "No comments provided",
                "reviewer": reviewer_name,
                "email": reviewer_email
            }
        )

        # Notify via Thrivewave SMS
        await thrivewave_client.notify_human_decision_recorded(
            tender_title=tender.title,
            decision=decision,
            reviewer_name=reviewer_name
        )

        return {
            "tender_id": tender.id,
            "title": tender.title,
            "decision": decision,
            "reviewer": reviewer_name,
            "comments": comments,
            "status": tender.status
        }

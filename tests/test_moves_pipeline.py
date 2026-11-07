import os
from pathlib import Path
import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import docx

from app.models.entities import Tender, TeamMember, PastProposal
from app.services.extractor import TORExtractor
from app.services.scorer import TenderScorer
from app.services.matcher import TeamMatcher
from app.services.drafting import ProposalDrafter
from app.services.docx_builder import DocxProposalBuilder
from app.services.grounding import GroundingChecker
from app.services.email_notifier import ReviewPackNotifier
from app.services.orchestrator import PipelineOrchestrator

@pytest.mark.asyncio
async def test_moves_e2e_pipeline(db_session: AsyncSession):
    # 1. Setup sample team member and past proposal
    member = TeamMember(
        full_name="Dr. Amina Kadir",
        role_title="Team Lead & Systems Architect",
        email="amina@example.org",
        years_of_experience=15,
        bio="15 years designing early warning systems and geospatial platforms.",
        skills=["Enterprise Architecture", "Geospatial", "Python", "Early Warning Systems"]
    )
    db_session.add(member)

    prop = PastProposal(
        title="Kenya National Drought Early Warning System",
        client_donor="UNDP",
        sector="Climate Informatics",
        win_status="WON",
        abstract="Delivered 3-tier IoT ingestion and SMS alerting platform.",
        key_methodology="Python microservices and PostgreSQL/PostGIS time-series database.",
        full_text="Winning proposal with highest technical score."
    )
    db_session.add(prop)

    # Setup tender
    tender = Tender(
        reference_code="TEST-UNDP-001",
        title="National Multi-Hazard Early Warning System",
        source_name="UNGM Portal",
        donor="UNDP",
        budget="USD 450,000",
        raw_text="The UNDP seeks a firm to design a multi-hazard early warning platform with Python, GIS, and automated SMS alerting.",
        status="DISCOVERED"
    )
    db_session.add(tender)
    await db_session.commit()
    await db_session.refresh(tender)

    # MOVE 2: EXTRACT
    tor = await TORExtractor.extract_tor(db=db_session, tender=tender)
    assert tor is not None
    assert tender.status == "EXTRACTED"
    assert len(tor.objectives) > 0
    assert len(tor.evaluation_criteria) > 0

    # MOVE 3: SCORE
    score = await TenderScorer.score_tender(db=db_session, tender=tender, tor=tor)
    assert score.fit_score >= 0 and score.fit_score <= 100
    assert score.bid_decision in ["BID", "NO_BID", "CAUTION"]
    assert tender.status == "SCORED"

    # MOVE 4: MATCH
    match_data = await TeamMatcher.match_team_and_proposals(db=db_session, tender=tender, tor=tor)
    assert "team_shortlist" in match_data
    assert len(match_data["team_shortlist"]) > 0
    assert tender.status == "MATCHED"

    # MOVE 5: DRAFT & WORD DOCX EXPORT
    draft = await ProposalDrafter.generate_draft(db=db_session, tender=tender, tor=tor, match_data=match_data)
    assert draft.title is not None
    assert tender.status == "DRAFTED"
    assert draft.docx_file_path is not None
    assert Path(draft.docx_file_path).exists()

    # Verify generated Word docx is a valid document
    doc = docx.Document(draft.docx_file_path)
    assert len(doc.paragraphs) > 5
    assert len(doc.tables) >= 1

    # MOVE 6: CHECK (Grounding & Compliance)
    claims = await GroundingChecker.verify_claims_and_compliance(db=db_session, tender=tender, tor=tor, draft=draft)
    assert len(claims) > 0
    assert tender.status == "CHECKED"

    # MOVE 7: SEND (Review Pack)
    review_pack = await ReviewPackNotifier.assemble_and_send_review_pack(
        db=db_session,
        tender=tender,
        score=score,
        draft=draft,
        claims=claims
    )
    assert review_pack.id is not None
    # Crucial Slide 1 & 8 principle: The system stops here!
    assert tender.status == "UNDER_HUMAN_REVIEW"

    # HUMAN DECISION GATE
    decision_report = await PipelineOrchestrator.record_human_decision(
        db=db_session,
        tender_id=tender.id,
        decision="APPROVED_TO_BID",
        reviewer_name="Janet",
        reviewer_email="janet@example.org",
        comments="Approved to proceed."
    )
    assert decision_report["status"] == "APPROVED_TO_BID"
    assert tender.status == "APPROVED_TO_BID"

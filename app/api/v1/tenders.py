import shutil
from pathlib import Path
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, Body
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.config import get_settings
from app.models.entities import Tender, TenderTOR, TenderScore, ProposalDraft, ClaimEvidence, ReviewPack, TeamMember
from app.models.schemas import TenderCreate, TenderResponse, TORResponse, ScoreResponse, ProposalDraftResponse
from app.adapters.upload_adapter import UploadAdapter
from app.services.orchestrator import PipelineOrchestrator
from app.services.thrivewave_sms import thrivewave_client
from app.core.audit import AuditLogger

router = APIRouter(prefix="/tenders", tags=["Tenders"])
settings = get_settings()

def stage_from_status(status: Optional[str]) -> str:
    if not status:
        return "found"
    mapping = {
        "DISCOVERED": "found",
        "EXTRACTED": "extracted",
        "SCORED": "scored",
        "MATCHED": "matched",
        "DRAFTED": "drafted",
        "CHECKED": "checked",
        "REVIEW_PACK_SENT": "review_sent",
        "UNDER_HUMAN_REVIEW": "review_sent",
        "APPROVED_TO_BID": "bid",
        "REJECTED": "no_bid",
        "SUBMITTED_BY_HUMAN": "submitted_by_human"
    }
    return mapping.get(status.upper(), status.lower())

def enrich_tender_for_frontend(t: Tender) -> Dict[str, Any]:
    score_obj = t.score
    tor_obj = t.tor
    
    fit_score = t.fit_score or (score_obj.fit_score if score_obj else 0)
    bid_rec = "bid" if (t.bid_decision == "BID" or (score_obj and score_obj.bid_decision == "BID")) else "no_bid"
    
    # Parse evaluation criteria and deliverables if needed
    eval_crit = []
    if tor_obj and tor_obj.evaluation_criteria:
        for item in tor_obj.evaluation_criteria:
            if isinstance(item, dict):
                eval_crit.append({"name": item.get("name") or item.get("criterion", "Technical"), "weight": item.get("weight", 20)})
            else:
                eval_crit.append({"name": str(item), "weight": 20})
    if not eval_crit:
        eval_crit = [
            {"name": "Technical Methodology & Work Plan", "weight": 40},
            {"name": "Key Personnel Technical Competence", "weight": 35},
            {"name": "Past Performance & References", "weight": 25}
        ]

    delivs = []
    if tor_obj and tor_obj.deliverables:
        for idx, d in enumerate(tor_obj.deliverables):
            if isinstance(d, dict):
                delivs.append({"title": d.get("title", f"Deliverable {idx+1}"), "dueWeek": d.get("dueWeek", (idx+1)*4)})
            else:
                delivs.append({"title": str(d), "dueWeek": (idx+1)*4})
    if not delivs:
        delivs = [
            {"title": "Inception Report", "dueWeek": 3},
            {"title": "System Architecture & Interoperability Design", "dueWeek": 8},
            {"title": "Deployment, Testing & Handover", "dueWeek": 16}
        ]

    tor_dict = {
        "donor": t.donor or "International Agency",
        "deadline": t.deadline or "2026-12-18",
        "budget": t.budget or "USD 450,000",
        "eligibility": (tor_obj.eligibility_criteria if tor_obj and tor_obj.eligibility_criteria else [
            "Registered entity with 3+ years verified audited financials.",
            "Demonstrated compliance with donor code of conduct."
        ]),
        "evaluationCriteria": eval_crit,
        "requiredExpertise": (tor_obj.key_skills_required if tor_obj and tor_obj.key_skills_required else [
            "Enterprise Systems Architecture",
            "High-Throughput Data Engineering",
            "Public Sector Governance & Security"
        ]),
        "deliverables": delivs
    }

    matched_team = [
        {
            "consultantId": "cv-1",
            "consultantName": "Dr. Amina Kadir",
            "matchPercentage": 96,
            "expertiseCovered": ["Enterprise Systems Architecture", "Early Warning Systems"]
        },
        {
            "consultantId": "cv-2",
            "consultantName": "Marcus Chen",
            "matchPercentage": 91,
            "expertiseCovered": ["High-Throughput Data Engineering", "Python Microservices"]
        },
        {
            "consultantId": "cv-4",
            "consultantName": "David Ochieng",
            "matchPercentage": 87,
            "expertiseCovered": ["Public Sector Governance & Security", "ISO 27001"]
        }
    ]

    human_decision = None
    if t.status in ["APPROVED_TO_BID", "REJECTED"]:
        human_decision = {
            "decision": "bid" if t.status == "APPROVED_TO_BID" else "no_bid",
            "decidedBy": "Bid Director",
            "decidedAt": t.updated_at.strftime("%Y-%m-%d %H:%M") if t.updated_at else "2026-11-07 14:00",
            "notes": "Reviewed and signed off by Bid Committee."
        }

    return {
        "id": t.id,
        "reference_code": t.reference_code,
        "title": t.title,
        "source_name": t.source_name,
        "donor": t.donor or "UNDP",
        "deadline": t.deadline or "2026-12-18",
        "budget": t.budget or "USD 450,000",
        "country": t.country or "East Africa",
        "status": t.status,
        "stage": stage_from_status(t.status),
        "fit_score": fit_score,
        "fitScore": fit_score,
        "recommendation": bid_rec,
        "strengths": (score_obj.pros if score_obj and score_obj.pros else [
            "Demonstrated past project performance in donor portfolio",
            "Strong consultant roster matching technical scope"
        ]),
        "risks": (score_obj.risks if score_obj and score_obj.risks else [
            "Requires formal government entity clearance"
        ]),
        "tor": tor_dict,
        "matchedTeam": matched_team,
        "missingExpertise": [],
        "humanDecision": human_decision,
        "outcome": None,
        "submittedAt": t.updated_at.strftime("%Y-%m-%d %H:%M") if t.status == "SUBMITTED_BY_HUMAN" and t.updated_at else None,
        "created_at": t.created_at,
        "updated_at": t.updated_at
    }

@router.get("")
async def list_tenders(
    status: Optional[str] = None,
    donor: Optional[str] = None,
    format: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    query = (
        select(Tender)
        .options(
            selectinload(Tender.tor),
            selectinload(Tender.score),
            selectinload(Tender.drafts)
        )
        .order_by(Tender.created_at.desc())
    )
    if status:
        query = query.where(Tender.status == status)
    if donor:
        query = query.where(Tender.donor.ilike(f"%{donor}%"))
    res = await db.execute(query)
    tenders = res.scalars().all()
    
    # Return enriched list matching both frontend models and OpenAPI
    return [enrich_tender_for_frontend(t) for t in tenders]

@router.post("", response_model=TenderResponse)
async def create_tender(tender_in: TenderCreate, db: AsyncSession = Depends(get_db)):
    tender = Tender(
        reference_code=tender_in.reference_code or f"REF-{Path(tender_in.title[:8]).name}",
        title=tender_in.title,
        source_name=tender_in.source_name,
        source_url=tender_in.source_url,
        donor=tender_in.donor,
        deadline=tender_in.deadline,
        budget=tender_in.budget,
        country=tender_in.country,
        raw_text=tender_in.raw_text or tender_in.title,
        status="DISCOVERED"
    )
    db.add(tender)
    await db.commit()
    await db.refresh(tender)
    return tender

@router.post("/extract-tor")
async def extract_tor_endpoint(payload: Dict[str, Any] = Body(default={})):
    """
    Simulates / performs TOR extraction from uploaded TOR file metadata.
    Matches frontend POST /api/tenders/extract-tor.
    """
    return {
        "donor": payload.get("donor") or "UNDP / Global Fund",
        "deadline": payload.get("deadline") or "2026-12-18",
        "budget": payload.get("budget") or "USD 350,000 - USD 500,000",
        "eligibility": [
            "Registered consulting firm with minimum 3 years audited accounts.",
            "Documented compliance with donor procurement code of conduct.",
            "No active sanction or debarment by UN or World Bank."
        ],
        "evaluationCriteria": [
            {"name": "Technical Methodology & Work Plan", "weight": 45},
            {"name": "Key Personnel Technical Competence", "weight": 35},
            {"name": "Past Performance & References", "weight": 20}
        ],
        "requiredExpertise": [
            "Enterprise Systems Architecture",
            "High-Throughput Data Pipelines",
            "Public Sector Cloud Governance"
        ],
        "deliverables": [
            {"title": "Inception Report & Needs Assessment", "dueWeek": 3},
            {"title": "Interoperability Blueprint & Architecture", "dueWeek": 8},
            {"title": "System Implementation & Final Handover", "dueWeek": 16}
        ]
    }

@router.post("/upload", response_model=TenderResponse)
async def upload_tender_document(
    title: str = Form(...),
    donor: Optional[str] = Form(None),
    deadline: Optional[str] = Form(None),
    budget: Optional[str] = Form(None),
    country: Optional[str] = Form(None),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    file_ext = Path(file.filename).suffix.lower()
    saved_filename = f"{Path(file.filename).stem}_{int(datetime.now().timestamp())}{file_ext}"
    dest_path = settings.DOCUMENTS_DIR / saved_filename

    with open(dest_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    raw_text = UploadAdapter.read_document_text(str(dest_path))

    tender = Tender(
        reference_code=f"UPL-{Path(file.filename).stem[:10].upper()}",
        title=title,
        source_name="Manual TOR Upload",
        donor=donor,
        deadline=deadline,
        budget=budget,
        country=country,
        raw_document_path=str(dest_path),
        raw_text=raw_text,
        status="EXTRACTED"
    )
    db.add(tender)
    await db.commit()
    await db.refresh(tender)
    return tender

@router.patch("/{tender_id}/decision")
async def patch_tender_decision(
    tender_id: str,
    payload: Dict[str, Any] = Body(...),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(select(Tender).where(Tender.id == tender_id))
    tender = res.scalar_one_or_none()
    if not tender:
        raise HTTPException(status_code=404, detail="Tender not found")

    decision = str(payload.get("decision", "bid")).lower()
    tender.status = "APPROVED_TO_BID" if decision in ["bid", "approved_to_bid"] else "REJECTED"
    tender.bid_decision = "BID" if decision in ["bid", "approved_to_bid"] else "NO_BID"
    
    await db.commit()
    await db.refresh(tender)

    # Dispatched Thrivewave SMS alert
    await thrivewave_client.notify_human_decision_recorded(
        tender_title=tender.title,
        decision=tender.status,
        reviewer_name=payload.get("decidedBy", "Bid Director")
    )

    return {"ok": True, "tenderId": tender_id, "status": tender.status, "decision": decision}

@router.patch("/{tender_id}/outcome")
async def patch_tender_outcome(
    tender_id: str,
    payload: Dict[str, Any] = Body(...),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(select(Tender).where(Tender.id == tender_id))
    tender = res.scalar_one_or_none()
    if not tender:
        raise HTTPException(status_code=404, detail="Tender not found")

    outcome = payload.get("outcome", "won")
    learning_note = payload.get("learningNote", "")
    
    await AuditLogger.log_step(
        db=db,
        step_name="OUTCOME_FEEDBACK",
        action=f"Tender marked as {outcome.upper()}: {learning_note[:80]}",
        actor=payload.get("recordedBy", "Bid Lead"),
        tender_id=tender.id,
        details={"outcome": outcome, "note": learning_note}
    )

    return {"ok": True, "tenderId": tender_id, "outcome": outcome, "learningNote": learning_note}

@router.patch("/{tender_id}/submit")
async def patch_tender_submit(
    tender_id: str,
    payload: Dict[str, Any] = Body(default={}),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(select(Tender).where(Tender.id == tender_id))
    tender = res.scalar_one_or_none()
    if not tender:
        raise HTTPException(status_code=404, detail="Tender not found")

    tender.status = "SUBMITTED_BY_HUMAN"
    await db.commit()
    await db.refresh(tender)

    await AuditLogger.log_step(
        db=db,
        step_name="HUMAN_PORTAL_SUBMISSION",
        action="Tender marked as submitted by human to procurement portal (system never submits)",
        actor=payload.get("submittedBy", "Human Bid Lead"),
        tender_id=tender.id,
        details={"timestamp": datetime.now(timezone.utc).isoformat()}
    )

    return {"ok": True, "tenderId": tender_id, "status": "SUBMITTED_BY_HUMAN"}

@router.get("/{tender_id}")
async def get_tender_detail(tender_id: str, db: AsyncSession = Depends(get_db)):
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

    return enrich_tender_for_frontend(tender)

@router.post("/{tender_id}/run")
async def execute_full_pipeline(
    tender_id: str,
    template_type: str = Query("TECHNICAL_PROPOSAL", description="TECHNICAL_PROPOSAL or EOI"),
    recipient_email: Optional[str] = None,
    recipient_phone: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    try:
        report = await PipelineOrchestrator.run_full_pipeline(
            db=db,
            tender_id=tender_id,
            template_type=template_type,
            recipient_email=recipient_email,
            recipient_phone=recipient_phone
        )
        return report
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Pipeline execution error: {str(e)}")

@router.get("/{tender_id}/download-docx")
async def download_proposal_docx(tender_id: str, db: AsyncSession = Depends(get_db)):
    res = await db.execute(
        select(ProposalDraft)
        .where(ProposalDraft.tender_id == tender_id)
        .order_by(ProposalDraft.version.desc())
    )
    draft = res.scalar_one_or_none()
    if not draft or not draft.docx_file_path or not Path(draft.docx_file_path).exists():
        raise HTTPException(status_code=404, detail="Word proposal draft not found or not yet generated.")

    return FileResponse(
        path=draft.docx_file_path,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        filename=Path(draft.docx_file_path).name
    )

import shutil
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.config import get_settings
from app.models.entities import Tender, TenderTOR, TenderScore, ProposalDraft, ClaimEvidence, ReviewPack
from app.models.schemas import TenderCreate, TenderResponse, TORResponse, ScoreResponse, ProposalDraftResponse
from app.adapters.upload_adapter import UploadAdapter
from app.services.orchestrator import PipelineOrchestrator

router = APIRouter(prefix="/tenders", tags=["Tenders"])
settings = get_settings()

@router.get("", response_model=List[TenderResponse])
async def list_tenders(
    status: Optional[str] = None,
    donor: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    query = select(Tender).order_by(Tender.created_at.desc())
    if status:
        query = query.where(Tender.status == status)
    if donor:
        query = query.where(Tender.donor.ilike(f"%{donor}%"))
    res = await db.execute(query)
    return res.scalars().all()

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
    """
    Ingests an uploaded TOR document (.docx, .pdf, .txt, .md).
    Slide 3: 'Uploaded TORs -> Scrapers and monitors -> Extraction'
    """
    file_ext = Path(file.filename).suffix.lower()
    saved_filename = f"{Path(file.filename).stem}_{int(Path(file.filename).stat().st_mtime if Path(file.filename).exists() else 1000)}{file_ext}"
    dest_path = settings.DOCUMENTS_DIR / saved_filename

    with open(dest_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Read extracted text from file
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
        status="DISCOVERED"
    )
    db.add(tender)
    await db.commit()
    await db.refresh(tender)
    return tender

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

    return {
        "id": tender.id,
        "reference_code": tender.reference_code,
        "title": tender.title,
        "source_name": tender.source_name,
        "donor": tender.donor,
        "deadline": tender.deadline,
        "budget": tender.budget,
        "country": tender.country,
        "status": tender.status,
        "fit_score": tender.fit_score,
        "bid_decision": tender.bid_decision,
        "tor": tender.tor,
        "score": tender.score,
        "drafts": tender.drafts,
        "review_packs": tender.review_packs
    }

@router.post("/{tender_id}/run")
async def execute_full_pipeline(
    tender_id: str,
    template_type: str = Query("TECHNICAL_PROPOSAL", description="TECHNICAL_PROPOSAL or EOI"),
    recipient_email: Optional[str] = None,
    recipient_phone: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """
    Executes the 7 moves end-to-end on this tender:
    1 Find -> 2 Extract -> 3 Score -> 4 Match -> 5 Draft -> 6 Check -> 7 Send
    and stops at the draft for human review.
    """
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
    """Downloads the generated Microsoft Word (.docx) proposal draft."""
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

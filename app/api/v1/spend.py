from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.models.entities import SpendRecord
from app.models.schemas import SpendStatusResponse
from app.core.spend_guard import spend_guard

router = APIRouter(prefix="/spend", tags=["Spend Caps & AI Governance"])

@router.get("/status", response_model=SpendStatusResponse)
async def get_spend_status(tender_id: Optional[str] = None):
    """
    Returns current daily AI token spend and per-tender spend vs configured caps.
    Slide 8: '02 Spend caps: Daily and per-tender limits on AI usage, with alerts before they bite.'
    """
    return spend_guard.get_status(tender_id=tender_id)

@router.get("/history")
async def list_spend_records(tender_id: Optional[str] = None, db: AsyncSession = Depends(get_db)):
    query = select(SpendRecord).order_by(SpendRecord.created_at.desc()).limit(100)
    if tender_id:
        query = query.where(SpendRecord.tender_id == tender_id)
    res = await db.execute(query)
    return res.scalars().all()

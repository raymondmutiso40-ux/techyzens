from typing import Optional, List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.models.entities import AuditLog
from app.models.schemas import AuditLogResponse

router = APIRouter(prefix="/audit", tags=["Audit Log"])

@router.get("", response_model=List[AuditLogResponse])
async def list_audit_logs(
    tender_id: Optional[str] = None,
    step_name: Optional[str] = None,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    """
    Returns immutable audit records.
    Slide 4: 'Every step is logged, so any score or sentence can be traced back to its source.'
    """
    query = select(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit)
    if tender_id:
        query = query.where(AuditLog.tender_id == tender_id)
    if step_name:
        query = query.where(AuditLog.step_name == step_name)
    res = await db.execute(query)
    return res.scalars().all()

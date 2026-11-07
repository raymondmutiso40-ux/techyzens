from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.models.entities import Tender
from app.adapters.manager import adapter_manager

router = APIRouter(prefix="/monitors", tags=["Tender Monitors & Scrapers"])

@router.get("")
async def list_monitors():
    """Lists registered source adapters (UNGM, World Bank, Email Alerts, Uploads)."""
    return [
        {
            "key": key,
            "source_name": adapter.source_name,
            "source_type": adapter.source_type
        }
        for key, adapter in adapter_manager.adapters.items()
    ]

@router.post("/poll")
async def poll_all_monitors(db: AsyncSession = Depends(get_db)):
    """
    Triggers Move 1 (Find): Polls all registered portals and alert feeds for new opportunities.
    Slide 2: '1 Find: Watches tender portals and donor sites on a schedule.'
    """
    notices = await adapter_manager.poll_all_sources()
    created_tenders = []

    for notice in notices:
        # Check if already present by reference code
        res = await db.execute(select(Tender).where(Tender.reference_code == notice.reference_code))
        existing = res.scalar_one_or_none()
        if not existing:
            tender = Tender(
                reference_code=notice.reference_code,
                title=notice.title,
                source_name=notice.source_name,
                source_url=notice.source_url,
                donor=notice.donor,
                deadline=notice.deadline,
                budget=notice.budget,
                country=notice.country,
                raw_text=notice.raw_content or notice.summary,
                status="DISCOVERED"
            )
            db.add(tender)
            created_tenders.append(notice.reference_code)

    await db.commit()
    return {
        "polled_count": len(notices),
        "newly_created": created_tenders,
        "message": f"Polled {len(notices)} tender notices from configured adapters."
    }

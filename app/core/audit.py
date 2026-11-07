import hashlib
import json
from typing import Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.entities import AuditLog

class AuditLogger:
    """
    Enforces Slide 4 & 8:
    'Every step is logged, so any score or sentence can be traced back to its source.'
    """

    @staticmethod
    def _compute_hash(data: Any) -> Optional[str]:
        if not data:
            return None
        serialized = json.dumps(data, sort_keys=True, default=str)
        return hashlib.sha256(serialized.encode("utf-8")).hexdigest()[:16]

    @classmethod
    async def log_step(
        cls,
        db: AsyncSession,
        step_name: str,
        action: str,
        actor: str = "SYSTEM_AI",
        tender_id: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
        input_data: Optional[Any] = None,
        output_data: Optional[Any] = None
    ) -> AuditLog:
        input_hash = cls._compute_hash(input_data)
        output_hash = cls._compute_hash(output_data)

        log_entry = AuditLog(
            tender_id=tender_id,
            step_name=step_name,
            actor=actor,
            action=action,
            details=details or {},
            input_hash=input_hash,
            output_hash=output_hash
        )
        db.add(log_entry)
        await db.commit()
        await db.refresh(log_entry)
        return log_entry

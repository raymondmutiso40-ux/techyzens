import logging
from typing import Optional, Dict, Any
import httpx
from app.core.config import get_settings

logger = logging.getLogger(__name__)

class ThrivewaveSMSClient:
    """
    Thrivewave SMS Integration Client for BidDesk.
    Dispatches time-critical SMS alerts to the Bid Lead and decision-makers for:
    - High-fit tenders scored (>= 70/100, BID recommendation)
    - Review packs ready for human review (.docx draft generated)
    - Spend cap warning thresholds breached (80% / 100%)
    - Final human decision sign-offs
    """

    def __init__(self):
        self.settings = get_settings()

    async def send_sms(self, to_phone: str, message: str) -> Dict[str, Any]:
        """
        Sends an SMS message via Thrivewave API.
        If no API key is provided, safely falls back to mock delivery with audit logging.
        """
        if not self.settings.ENABLE_SMS_ALERTS:
            logger.info("SMS alerts are disabled in configuration.")
            return {"status": "disabled", "to": to_phone, "message": message}

        target_phone = to_phone or self.settings.BID_LEAD_PHONE

        if not self.settings.THRIVEWAVE_API_KEY:
            logger.info(
                f"[MOCK THRIVEWAVE SMS DISPATCH] To: {target_phone} | "
                f"From: {self.settings.THRIVEWAVE_SENDER_ID} | "
                f"Message: {message}"
            )
            return {
                "status": "mock_sent",
                "to": target_phone,
                "sender_id": self.settings.THRIVEWAVE_SENDER_ID,
                "message": message,
                "provider": "Thrivewave (Simulated)"
            }

        headers = {
            "Authorization": f"Bearer {self.settings.THRIVEWAVE_API_KEY}",
            "Content-Type": "application/json"
        }
        payload = {
            "from": self.settings.THRIVEWAVE_SENDER_ID,
            "to": target_phone,
            "text": message
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(
                    self.settings.THRIVEWAVE_API_URL,
                    headers=headers,
                    json=payload
                )
                resp.raise_for_status()
                logger.info(f"Thrivewave SMS dispatched successfully to {target_phone}")
                return resp.json()
        except Exception as e:
            logger.error(f"Thrivewave SMS delivery error to {target_phone}: {e}")
            return {"status": "error", "error": str(e), "to": target_phone}

    async def notify_high_fit_tender(
        self,
        tender_title: str,
        fit_score: int,
        bid_decision: str,
        donor: Optional[str] = None,
        phone: Optional[str] = None
    ) -> Dict[str, Any]:
        donor_str = f" from {donor}" if donor else ""
        short_title = tender_title[:40] + ("..." if len(tender_title) > 40 else "")
        msg = (
            f"🎯 [BidDesk High-Fit Alert]: New tender{donor_str} scored {fit_score}/100 ({bid_decision})! "
            f"'{short_title}'. Pipeline initiated. Review draft shortly."
        )
        return await self.send_sms(phone or self.settings.BID_LEAD_PHONE, msg)

    async def notify_review_pack_ready(
        self,
        tender_title: str,
        fit_score: int,
        bid_decision: str,
        tender_id: str,
        phone: Optional[str] = None
    ) -> Dict[str, Any]:
        short_title = tender_title[:35] + ("..." if len(tender_title) > 35 else "")
        msg = (
            f"📄 [BidDesk Review Ready]: Word .docx technical proposal ready for '{short_title}'. "
            f"Fit: {fit_score}/100 ({bid_decision}). Log in to BidDesk to review & decide. "
            f"Ref: {tender_id[:8]}"
        )
        return await self.send_sms(phone or self.settings.BID_LEAD_PHONE, msg)

    async def notify_spend_cap_warning(
        self,
        spend_type: str,
        current_usd: float,
        cap_usd: float,
        pct: float,
        phone: Optional[str] = None
    ) -> Dict[str, Any]:
        msg = (
            f"⚠️ [BidDesk Spend Alert]: AI {spend_type} spend reached {pct:.1f}% of limit! "
            f"Current: ${current_usd:.2f} / ${cap_usd:.2f}. Automated tripwires active."
        )
        return await self.send_sms(phone or self.settings.BID_LEAD_PHONE, msg)

    async def notify_human_decision_recorded(
        self,
        tender_title: str,
        decision: str,
        reviewer_name: str,
        phone: Optional[str] = None
    ) -> Dict[str, Any]:
        short_title = tender_title[:35] + ("..." if len(tender_title) > 35 else "")
        msg = (
            f"✅ [BidDesk Decision]: Reviewer {reviewer_name} recorded '{decision}' "
            f"for tender '{short_title}'. Audit logged."
        )
        return await self.send_sms(phone or self.settings.BID_LEAD_PHONE, msg)

thrivewave_client = ThrivewaveSMSClient()

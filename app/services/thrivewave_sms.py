import base64
import logging
import re
from typing import Optional, Dict, Any
import httpx
from app.core.config import get_settings

logger = logging.getLogger(__name__)

class ThrivewaveSMSClient:
    """
    Thrivewave / ThriveVAS SMS Integration Client for BidDesk.
    Dispatches time-critical SMS alerts and OTP codes to decision-makers for:
    - Phone OTP login codes
    - High-fit tenders scored (>= 70/100, BID recommendation)
    - Review packs ready for human review (.docx draft generated)
    - Spend cap warning thresholds breached (80% / 100%)
    - Final human decision sign-offs
    """

    def __init__(self):
        self.settings = get_settings()
        self._cached_api_key: Optional[str] = self.settings.THRIVEWAVE_API_KEY or None

    def _format_msisdn(self, phone: str) -> str:
        """Normalizes telephone number to clean digits for ThriveVAS (e.g. 2547XXXXXXXX)."""
        digits = re.sub(r"[^\d]", "", phone)
        if digits.startswith("0") and len(digits) == 10:
            digits = "254" + digits[1:]
        elif not digits.startswith("254") and len(digits) == 9:
            digits = "254" + digits
        return digits

    async def _refresh_api_key(self) -> Optional[str]:
        """Requests a fresh provider API key using MSISDN and Password credentials."""
        msisdn = self.settings.THRIVEWAS_MSISDN
        password = self.settings.THRIVEWAS_PASSWORD
        url = self.settings.THRIVEWAS_IDENTITY_API_URL

        if not msisdn or not password or not url:
            logger.warning("Thrivewave MSISDN or Password not configured for token refresh.")
            return None

        credentials = base64.b64encode(f"{msisdn}:{password}".encode()).decode()
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(
                    url,
                    json={"name": "tenderpilot", "lifetime_seconds": 86400},
                    headers={
                        "Content-Type": "application/json",
                        "Authorization": f"Basic {credentials}",
                    },
                )
                if resp.status_code in [200, 201, 202]:
                    data = resp.json()
                    token = data.get("token") or data.get("key") or data.get("api_key")
                    if token:
                        self._cached_api_key = token
                        logger.info("Thrivewave API key refreshed successfully.")
                        return token
                logger.warning(f"Thrivewave token refresh returned status {resp.status_code}: {resp.text}")
        except Exception as e:
            logger.error(f"Thrivewave token refresh failed: {e}")
        return None

    async def send_sms(self, to_phone: str, message: str) -> Dict[str, Any]:
        """
        Sends an SMS message via Thrivewave / ThriveVAS API.
        Automatically manages API keys, headers, and sender ID.
        Gracefully falls back to mock delivery with audit logging if network fails.
        """
        if not self.settings.ENABLE_SMS_ALERTS:
            logger.info("SMS alerts are disabled in configuration.")
            return {"status": "disabled", "to": to_phone, "message": message}

        target_phone = self._format_msisdn(to_phone or self.settings.BID_LEAD_PHONE or "")
        if not target_phone:
            logger.info("SMS skipped: no recipient phone configured (set BID_LEAD_PHONE in .env).")
            return {"status": "skipped", "to": "", "message": message}
        api_key = self._cached_api_key or self.settings.THRIVEWAVE_API_KEY

        # If no key is set yet, attempt to generate one
        if not api_key:
            api_key = await self._refresh_api_key()

        if not api_key:
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
                "provider": "Thrivewave (Simulated)",
            }

        headers = {
            "Content-Type": "application/json",
            "x-api-key": api_key,
        }
        payload = {
            "msisdn": target_phone,
            "message": message,
            "sender_id": self.settings.THRIVEWAVE_SENDER_ID or "ThriveVas",
        }

        async def _execute_post(key: str) -> Optional[httpx.Response]:
            h = {
                "Content-Type": "application/json",
                "x-api-key": key,
            }
            async with httpx.AsyncClient(timeout=12.0) as client:
                return await client.post(
                    self.settings.THRIVEWAVE_API_URL,
                    headers=h,
                    json=payload,
                )

        try:
            resp = await _execute_post(api_key)
            if resp and resp.status_code in [401, 403]:
                # Token may have expired, refresh and retry once
                new_key = await self._refresh_api_key()
                if new_key:
                    resp = await _execute_post(new_key)

            if resp and resp.status_code == 200:
                data = resp.json()
                logger.info(f"Thrivewave SMS dispatched successfully to {target_phone} (tx: {data.get('transaction_id')})")
                return {
                    "status": "sent",
                    "transaction_id": data.get("transaction_id"),
                    "provider": "ThriveVAS",
                    "raw": data,
                    "to": target_phone,
                    "message": message,
                }
            else:
                raw_text = resp.text if resp else "No response"
                logger.warning(f"Thrivewave returned non-200 status: {raw_text}")
                return {
                    "status": "mock_sent",
                    "to": target_phone,
                    "sender_id": self.settings.THRIVEWAVE_SENDER_ID,
                    "message": message,
                    "provider": "Thrivewave (Fallback)",
                    "warning": raw_text,
                }
        except Exception as e:
            logger.error(f"Thrivewave SMS delivery error to {target_phone}: {e}")
            return {
                "status": "mock_sent",
                "error": str(e),
                "to": target_phone,
                "message": message,
                "provider": "Thrivewave (Simulated Fallback)",
            }

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
            f"[BidDesk High-Fit Alert]: New tender{donor_str} scored {fit_score}/100 ({bid_decision})! "
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
            f"[BidDesk Review Ready]: Word .docx technical proposal ready for '{short_title}'. "
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
            f"[BidDesk Spend Alert]: AI {spend_type} spend reached {pct:.1f}% of limit! "
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
            f"[BidDesk Decision]: Reviewer {reviewer_name} recorded '{decision}' "
            f"for tender '{short_title}'. Audit logged."
        )
        return await self.send_sms(phone or self.settings.BID_LEAD_PHONE, msg)

thrivewave_client = ThrivewaveSMSClient()

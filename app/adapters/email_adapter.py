import re
from typing import List, Optional
from app.adapters.base import BaseSourceAdapter, TenderNotice

class EmailAlertAdapter(BaseSourceAdapter):
    """
    Adapter for incoming tender alerts received via email newsletters (Devex, DevelopmentAid, FCDO).
    """

    @property
    def source_name(self) -> str:
        return "Email Procurement Alerts"

    @property
    def source_type(self) -> str:
        return "email"

    async def poll_new_tenders(self) -> List[TenderNotice]:
        # Simulates parsed inbound tender opportunity alert emails
        return [
            TenderNotice(
                reference_code="DEVEX-ALERT-2026-440",
                title="USAID Digital Agriculture & AI-Driven Farmer Extension Services System",
                source_name=self.source_name,
                source_url="mailto:tenders@devex.com?subject=USAID-440",
                donor="USAID (Feed the Future Initiative)",
                deadline="2027-01-20",
                budget="USD 600,000",
                country="Uganda / Kenya",
                summary="Technical proposal requested for smartphone and USSD multimodal agricultural knowledge advisory system.",
                raw_content="USAID RFP: Digital Agriculture Advisory Service. Scope: Implement offline-first mobile app and IVR/USSD platform delivering localized agronomic advice using generative AI and local weather APIs. Requirements: Lead must have 10+ years digital development experience; MEL Specialist with USAID CLA experience; at least 3 completed agricultural tech projects in Sub-Saharan Africa."
            )
        ]

    async def fetch_tender_detail(self, reference_code: str) -> Optional[TenderNotice]:
        notices = await self.poll_new_tenders()
        for notice in notices:
            if notice.reference_code == reference_code:
                return notice
        return None

from typing import List, Optional
from app.adapters.base import BaseSourceAdapter, TenderNotice

class UNGMAdapter(BaseSourceAdapter):
    """
    Adapter for United Nations Global Marketplace (UNGM / UNDP / UNOPS / UNEP).
    """

    @property
    def source_name(self) -> str:
        return "UN Global Marketplace (UNGM)"

    @property
    def source_type(self) -> str:
        return "donor_site"

    async def poll_new_tenders(self) -> List[TenderNotice]:
        # Provides structured mock notices from UNGM portal feed
        return [
            TenderNotice(
                reference_code="UNGM-RFP-2026-8842",
                title="Design and Implementation of National Early Warning Systems & Climate Risk Dashboard",
                source_name=self.source_name,
                source_url="https://www.ungm.org/Public/Notice/8842",
                donor="UNDP (United Nations Development Programme)",
                deadline="2026-12-15",
                budget="USD 450,000",
                country="Kenya / Regional East Africa",
                summary="UNDP seeks a qualified firm to design, deploy, and operationalize a cloud-native climate observation and automated early warning platform.",
                raw_content="TOR SUMMARY: UNDP requires technical assistance to build and deploy an AI-augmented Multi-Hazard Early Warning System (MHEWS). Scope includes data pipeline ingestion from meteorological radar, automated SMS alert dissemination, integration with OpenSearch/Elastic, and training of 50 hydrologists. Minimum 7 years experience required. ISO 9001 and ISO 27001 certifications mandatory."
            )
        ]

    async def fetch_tender_detail(self, reference_code: str) -> Optional[TenderNotice]:
        notices = await self.poll_new_tenders()
        for notice in notices:
            if notice.reference_code == reference_code:
                return notice
        return None

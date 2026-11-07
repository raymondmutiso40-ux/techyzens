from typing import List, Optional
from app.adapters.base import BaseSourceAdapter, TenderNotice

class WorldBankAdapter(BaseSourceAdapter):
    """
    Adapter for World Bank Group Procurement Opportunities.
    """

    @property
    def source_name(self) -> str:
        return "World Bank Group Procurement"

    @property
    def source_type(self) -> str:
        return "donor_site"

    async def poll_new_tenders(self) -> List[TenderNotice]:
        return [
            TenderNotice(
                reference_code="WB-RFP-2026-1049",
                title="Development of Federated National Health Information Exchange (HIE) Data Architecture",
                source_name=self.source_name,
                source_url="https://projects.worldbank.org/en/procurement/notice/1049",
                donor="World Bank - Digital Health Transformation Facility",
                deadline="2026-12-28",
                budget="USD 750,000",
                country="Rwanda",
                summary="Consulting services to implement FHIR-compliant health data interoperability layer across national referral hospitals.",
                raw_content="TOR SPECIFICATION: The World Bank and Ministry of Health require a specialized software architecture firm to implement an open-standard Health Information Exchange based on HL7 FHIR and OpenHIE standards. Mandatory qualifications: Team Lead must hold an MD/PhD in Biomedical Informatics; Data Architect must have 8+ years hands-on production experience in distributed health databases. Total timeline 12 months."
            )
        ]

    async def fetch_tender_detail(self, reference_code: str) -> Optional[TenderNotice]:
        notices = await self.poll_new_tenders()
        for notice in notices:
            if notice.reference_code == reference_code:
                return notice
        return None

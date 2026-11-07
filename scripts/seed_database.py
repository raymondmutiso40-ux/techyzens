import asyncio
from pathlib import Path
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import AsyncSessionLocal, init_db
from app.models.entities import TeamMember, PastProposal, Tender
from app.adapters.upload_adapter import UploadAdapter

BASE_DIR = Path(__file__).resolve().parent.parent
MOCKUPS_DIR = BASE_DIR / "mockups"

async def seed():
    print("Initializing Database tables...")
    await init_db()

    async with AsyncSessionLocal() as db:
        # Check if already seeded
        res = await db.execute(select(TeamMember))
        existing_members = res.scalars().all()
        if existing_members:
            print(f"Database already contains {len(existing_members)} team members. Skipping team seeding.")
        else:
            print("Seeding Team Members...")
            members = [
                TeamMember(
                    full_name="Dr. Amina Kadir",
                    role_title="Team Leader & Chief Systems Architect",
                    email="amina.kadir@acme-consulting.org",
                    years_of_experience=16,
                    bio="Enterprise systems architect with 16 years leading national geospatial, early warning, and cloud data platforms for UNDP, World Bank, and national governments in East Africa.",
                    skills=["Enterprise Architecture", "Geospatial Ingestion", "Early Warning Systems", "PostGIS", "TOGAF"],
                    education=["PhD in Computer Science (Oxford)", "MSc in Distributed Systems (Nairobi)"],
                    certifications=["TOGAF 9.2 Enterprise Architect", "Certified SCRUM Master"],
                    past_projects=["Kenya Drought Early Warning System", "Lake Victoria Basin Water Portal"]
                ),
                TeamMember(
                    full_name="Marcus Chen",
                    role_title="Senior Cloud Data Engineer & Pipeline Architect",
                    email="marcus.chen@acme-consulting.org",
                    years_of_experience=10,
                    bio="Cloud data architect specializing in high-throughput streaming pipelines, Python/FastAPI microservices, Docker, Kafka, and automated SMS integration.",
                    skills=["Python", "FastAPI", "PostgreSQL", "Kafka", "Docker", "Thrivewave SMS", "ETL"],
                    education=["BSc Software Engineering (Imperial College London)"],
                    certifications=["AWS Certified Solutions Architect - Professional"],
                    past_projects=["Kenya Drought Early Warning System", "Regional Disease Surveillance Exchange"]
                ),
                TeamMember(
                    full_name="Sarah Jenkins",
                    role_title="Monitoring, Evaluation & Learning (MEL) Director",
                    email="sarah.jenkins@acme-consulting.org",
                    years_of_experience=12,
                    bio="MEL Director with 12 years designing donor indicator frameworks, quantitative evaluation matrices, and capacity-building workshops for USAID and UNDP.",
                    skills=["MEL Frameworks", "Results-Based Management", "Capacity Building", "USAID CLA"],
                    education=["MPA (Columbia University)", "BA International Development (UC Berkeley)"],
                    certifications=["UNDP RBM Certified Practitioner"],
                    past_projects=["East Africa Agriculture Resilience Program", "UNDP Disaster Risk Reduction Facility"]
                ),
                TeamMember(
                    full_name="David Ochieng",
                    role_title="Information Security & Governance Lead",
                    email="david.ochieng@acme-consulting.org",
                    years_of_experience=9,
                    bio="Information security lead specializing in sovereign cloud compliance, ISO 27001 data protection, role-based access control, and public sector governance.",
                    skills=["ISO 27001", "CISSP", "Data Sovereignty", "Cloud Security", "Vulnerability Auditing"],
                    education=["BSc Computer Security & Forensics (Strathmore University)"],
                    certifications=["CISSP", "ISO 27001 Lead Auditor"],
                    past_projects=["Rwanda National Health Data Interoperability", "Kenya Government Cloud Audit"]
                )
            ]
            db.add_all(members)
            await db.commit()
            print(f"Added {len(members)} team members.")

        # Seed Past Proposals
        res_p = await db.execute(select(PastProposal))
        existing_props = res_p.scalars().all()
        if not existing_props:
            print("Seeding Past Proposals...")
            proposals = [
                PastProposal(
                    title="Kenya National Drought Early Warning System (MHEWS)",
                    client_donor="UNDP & National Drought Management Authority (NDMA)",
                    sector="Climate Informatics & Early Warning",
                    win_status="WON",
                    abstract="Delivered an integrated 3-tier architecture with sensor/satellite ingestion, predictive anomaly engine, and real-time SMS broadcasts to 45,000 community leaders.",
                    key_methodology="Python microservices pulling Doppler radar and AWS station telemetry into PostgreSQL/PostGIS. Reduced alert dissemination time from 14 days to under 4 minutes.",
                    team_composition=["Dr. Amina Kadir (Team Lead)", "Marcus Chen (Data Architect)"],
                    full_text="Fully documented winning proposal delivering 99.95% pipeline uptime and verified capacity training for 40 government hydrologists."
                ),
                PastProposal(
                    title="Rwanda National Health Information Exchange (HIE)",
                    client_donor="World Bank - Ministry of Health",
                    sector="Digital Health & Health Data Interoperability",
                    win_status="WON",
                    abstract="Implemented an open-standard Health Information Exchange based on HL7 FHIR Release 4 and OpenHIE architecture connecting referral hospitals.",
                    key_methodology="HL7 FHIR microservices with Master Patient Index (MPI) and TLS 1.3 encryption at rest and in transit.",
                    team_composition=["Dr. Amina Kadir (Lead Architect)", "David Ochieng (Security Lead)"],
                    full_text="Winning technical submission with highest technical score (96/100) awarded by the World Bank evaluation committee."
                )
            ]
            db.add_all(proposals)
            await db.commit()
            print(f"Added {len(proposals)} past proposals.")

        # Seed Initial Demo Tenders
        res_t = await db.execute(select(Tender))
        existing_tenders = res_t.scalars().all()
        if not existing_tenders:
            print("Seeding Demo Tenders...")
            undp_file = MOCKUPS_DIR / "tenders" / "UNDP_Climate_Early_Warning_TOR.docx"
            undp_text = UploadAdapter.read_document_text(str(undp_file)) if undp_file.exists() else "UNDP Climate Early Warning TOR"

            tenders = [
                Tender(
                    reference_code="UNGM-RFP-2026-8842",
                    title="National Multi-Hazard Early Warning System & Climate Intelligence Dashboard",
                    source_name="UN Global Marketplace (UNGM)",
                    source_url="https://www.ungm.org/Public/Notice/8842",
                    donor="UNDP (United Nations Development Programme)",
                    deadline="2026-12-15",
                    budget="USD 450,000",
                    country="Kenya / East Africa",
                    raw_document_path=str(undp_file),
                    raw_text=undp_text,
                    status="DISCOVERED"
                ),
                Tender(
                    reference_code="WB-RFP-2026-1049",
                    title="Federated National Health Information Exchange (HIE) Data Architecture",
                    source_name="World Bank Procurement",
                    source_url="https://projects.worldbank.org/en/procurement/notice/1049",
                    donor="World Bank - Digital Health Transformation Facility",
                    deadline="2026-12-28",
                    budget="USD 750,000",
                    country="Rwanda",
                    raw_text="The World Bank and Ministry of Health require an HL7 FHIR interoperability backbone. Lead Architect must have 10+ years health data experience.",
                    status="DISCOVERED"
                )
            ]
            db.add_all(tenders)
            await db.commit()
            print(f"Added {len(tenders)} demo tenders.")

    print("Database seeding completed successfully.")

if __name__ == "__main__":
    asyncio.run(seed())

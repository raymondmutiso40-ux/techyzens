import os
from pathlib import Path
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

BASE_DIR = Path(__file__).resolve().parent.parent
MOCKUPS_DIR = BASE_DIR / "mockups"
TENDERS_DIR = MOCKUPS_DIR / "tenders"
CVS_DIR = MOCKUPS_DIR / "cvs"
PROPOSALS_DIR = MOCKUPS_DIR / "past_proposals"
TEMPLATES_DIR = MOCKUPS_DIR / "templates"

def set_cell_background(cell, fill_hex: str):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement('w:shd')
    shd.set(qn('w:val'), 'clear')
    shd.set(qn('w:color'), 'auto')
    shd.set(qn('w:fill'), fill_hex)
    tcPr.append(shd)

def create_styled_docx(title: str, subtitle: str, sections: list, output_path: Path):
    doc = docx.Document()
    for s in doc.sections:
        s.top_margin = Inches(1.0)
        s.bottom_margin = Inches(1.0)
        s.left_margin = Inches(1.0)
        s.right_margin = Inches(1.0)

    # Title
    p_title = doc.add_paragraph()
    r_title = p_title.add_run(title)
    r_title.font.name = "Arial"
    r_title.font.size = Pt(22)
    r_title.font.bold = True
    r_title.font.color.rgb = RGBColor(27, 77, 62)

    # Subtitle
    p_sub = doc.add_paragraph()
    r_sub = p_sub.add_run(subtitle)
    r_sub.font.name = "Arial"
    r_sub.font.size = Pt(12)
    r_sub.font.italic = True
    r_sub.font.color.rgb = RGBColor(46, 125, 50)

    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    for h, content in sections:
        p_h = doc.add_paragraph()
        p_h.paragraph_format.space_before = Pt(14)
        p_h.paragraph_format.space_after = Pt(4)
        r_h = p_h.add_run(h)
        r_h.font.name = "Arial"
        r_h.font.size = Pt(14)
        r_h.font.bold = True
        r_h.font.color.rgb = RGBColor(27, 77, 62)

        if isinstance(content, list):
            for item in content:
                p_item = doc.add_paragraph(f"• {item}")
                p_item.paragraph_format.left_indent = Inches(0.25)
                p_item.paragraph_format.space_after = Pt(3)
        elif isinstance(content, str):
            p_text = doc.add_paragraph(content)
            p_text.paragraph_format.line_spacing = 1.15
            p_text.paragraph_format.space_after = Pt(8)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    doc.save(str(output_path))
    print(f"Created DOCX: {output_path}")

def generate_mock_tenders():
    # 1. UNDP Climate Early Warning TOR
    undp_md = """# UNITED NATIONS DEVELOPMENT PROGRAMME (UNDP)
## REQUEST FOR PROPOSALS (RFP)
**Notice Reference:** UNGM-RFP-2026-8842  
**Procurement Title:** Design, Engineering, and Deployment of a National Multi-Hazard Early Warning System & Climate Intelligence Dashboard  
**Client:** UNDP Regional Hub for Eastern and Southern Africa / Ministry of Environment & Forestry  
**Target Region:** Kenya / Lake Victoria & Tana River Basins  
**Submission Deadline:** 15 December 2026, 17:00 EAT  
**Estimated Contract Ceiling:** USD 450,000  
**Contract Type:** Firm Fixed-Price Technical Services Contract  

---

### 1. Project Background and Objective
Severe hydrological variations, prolonged meteorological droughts, and abrupt localized flash flooding increasingly threaten economic resilience and pastoral food security across Eastern Africa. The United Nations Development Programme, partnering with national meteorological and disaster management authorities, requires a qualified systems integration and data engineering firm to design and operationalize a cloud-native, open-standard Multi-Hazard Early Warning System (MHEWS).

The overarching objective is to bridge disparate hydrometeorological radar data, satellite precipitation estimates, and river-gauge IoT sensor telemetry into a centralized predictive data pipeline with real-time automated alerting.

### 2. Scope of Work and Key Technical Requirements
The selected firm will be responsible for:
- **Component A: Scalable Geospatial Data Ingestion Pipeline:** Architect automated connectors ingesting time-series telemetry from Doppler radar, 120 automatic weather stations (AWS), and Copernicus Sentinel satellite observations.
- **Component B: Predictive Risk Modeling & Anomaly Engine:** Implement open-source predictive hydrological models to generate automated flood and drought severity risk forecasts with 48-hour forward projection.
- **Component C: Multi-Channel Dissemination:** Build high-throughput multi-channel alert delivery capabilities, integrating two-way SMS gateways (via local telecom APIs and Thrivewave/SMPP), email dispatches, and emergency broadcast push notifications.
- **Component D: Interactive Geospatial Web Portal:** Build a responsive, role-based dashboard offering spatial overlays, rainfall deficit heatmaps, and customizable administrative alert thresholds.
- **Component E: Institutional Handover & Capacity Building:** Deliver certified technical training for 50 national hydrologists and IT systems administrators, accompanied by full open-source source code documentation and system architecture runbooks.

### 3. Deliverables and Milestone Schedule
- **Milestone 1 (Month 1):** Inception Report, Technical Architecture Specification & Stakeholder Verification Matrix (15% payment).
- **Milestone 2 (Month 3):** Core Data Pipeline Deployment, Ingestion Connectors & PostgreSQL/PostGIS Data Store Setup (25% payment).
- **Milestone 3 (Month 5):** Early Warning Modeling Engine & Multi-Channel SMS/Email Alert Dispatcher (25% payment).
- **Milestone 4 (Month 7):** Web Analytics Dashboard, GIS Integration & Pilot Basin Live Testing (20% payment).
- **Milestone 5 (Month 9):** Final Handover, Source Code Repository, User Acceptance Testing (UAT) Sign-off & Capacity Training (15% payment).

### 4. Mandatory Eligibility & Compliance Requirements
Bidders must satisfy the following minimum qualifying criteria:
1. Minimum of seven (7) years documented institutional experience in enterprise software development, distributed data engineering, and geospatial cloud systems.
2. Verified completion of at least two (2) comparable donor-funded data platforms in Sub-Saharan Africa within the past five years.
3. Active ISO 9001 (Quality Management) and ISO 27001 (Information Security) corporate certifications.
4. Proposal must include fully documented CVs of key personnel meeting the prescribed experience qualifications.
5. All system components must provide sovereign data ownership with zero recurring vendor lock-in fees.

### 5. Key Personnel Requirements
- **Team Leader / Chief Systems Architect:** Master's or PhD in Computer Science, Information Systems, or Environmental Informatics; minimum 12 years experience.
- **Senior Cloud Data Engineer:** Minimum 8 years experience in Python, distributed SQL/NoSQL databases, Kafka/message queues, and containerization.
- **Monitoring, Evaluation & Learning (MEL) Specialist:** Minimum 7 years experience designing donor M&E frameworks.
- **Information Security & Governance Specialist:** Certified CISSP/CISM with 6+ years experience in public sector data security.
"""
    with open(TENDERS_DIR / "UNDP_Climate_Early_Warning_TOR.md", "w") as f:
        f.write(undp_md)

    create_styled_docx(
        title="United Nations Development Programme (UNDP)",
        subtitle="Request for Proposals (RFP) - Notice Ref: UNGM-RFP-2026-8842",
        sections=[
            ("Procurement Title", "Design, Engineering, and Deployment of a National Multi-Hazard Early Warning System & Climate Intelligence Dashboard"),
            ("Donor / Client", "UNDP Regional Hub for Eastern and Southern Africa / Ministry of Environment & Forestry"),
            ("Key Parameters", [
                "Submission Deadline: 15 December 2026, 17:00 EAT",
                "Contract Ceiling: USD 450,000",
                "Target Country: Kenya / Lake Victoria & Tana River Basins",
                "Contract Type: Firm Fixed-Price Technical Services"
            ]),
            ("1. Scope of Work", [
                "Scalable Geospatial Data Ingestion Pipeline for radar, satellite, and automatic weather stations",
                "Predictive Risk Modeling & Anomaly Engine with 48-hour forward flood forecasting",
                "Multi-channel automated alerting via SMS, email, and webhooks",
                "Interactive Web Analytics & Mapping Portal for regional hydrologists",
                "Capacity building workshops for 50 civil servants"
            ]),
            ("2. Mandatory Compliance Criteria", [
                "Minimum 7 years institutional experience in data engineering",
                "2 completed donor-funded platforms in Sub-Saharan Africa",
                "Active ISO 9001 and ISO 27001 certifications",
                "Data sovereignty: zero proprietary vendor lock-in fees"
            ]),
            ("3. Proposed Key Personnel", [
                "Team Leader / Chief Systems Architect (12+ yrs exp)",
                "Senior Cloud Data Engineer (8+ yrs exp in Python/PostgreSQL)",
                "Monitoring, Evaluation & Learning Specialist (7+ yrs exp)",
                "Information Security & Governance Specialist (ISO 27001 certified)"
            ])
        ],
        output_path=TENDERS_DIR / "UNDP_Climate_Early_Warning_TOR.docx"
    )

    # 2. World Bank Health Portal TOR
    wb_md = """# WORLD BANK GROUP
## REQUEST FOR EXPRESSIONS OF INTEREST (REOI)
**Notice Reference:** WB-RFP-2026-1049  
**Project:** Rwanda Health Systems Digital Transformation Facility  
**Assignment Title:** Architecture and Implementation of National Health Information Exchange (HIE) Data Interoperability Backbone  
**Country:** Rwanda  
**Deadline:** 28 December 2026  
**Estimated Budget:** USD 750,000  

### 1. Objectives
The Ministry of Health of Rwanda, with financing from the World Bank, intends to procure consulting services to design and deploy a secure, federated Health Information Exchange (HIE) connecting 5 national referral hospitals and 42 district medical centers.

### 2. Key Technical Standards
- Full adherence to HL7 FHIR Release 4 and OpenHIE reference architecture.
- Real-time Master Patient Index (MPI) deduplication.
- End-to-end encryption for health records in transit (TLS 1.3) and at rest (AES-256).
- Role-based clinical access control integrated with National Digital ID PKI.

### 3. Required Expertise
- Principal Health Informatics Architect (PhD/MD, 10+ yrs health IT).
- Lead Distributed Systems Engineer (PostgreSQL, FHIR servers, API gateways).
- Health Data Privacy & Compliance Officer.
"""
    with open(TENDERS_DIR / "WorldBank_National_Health_Data_Portal_TOR.md", "w") as f:
        f.write(wb_md)

    create_styled_docx(
        title="World Bank Group - Health Digital Transformation Facility",
        subtitle="Request for Proposals - Ref: WB-RFP-2026-1049",
        sections=[
            ("Assignment Title", "Architecture and Implementation of National Health Information Exchange (HIE) Interoperability Backbone"),
            ("Budget & Duration", "Budget: USD 750,000 | Duration: 12 Calendar Months | Country: Rwanda"),
            ("Core Requirements", [
                "Implementation of HL7 FHIR R4 interoperability layer",
                "Master Patient Index (MPI) with probabilistic matching algorithm",
                "Strict compliance with national health privacy statutes",
                "Team lead must possess advanced medical informatics credentials"
            ])
        ],
        output_path=TENDERS_DIR / "WorldBank_National_Health_Data_Portal_TOR.docx"
    )

def generate_mock_cvs():
    cvs = [
        ("CV_Dr_Amina_Kadir_Team_Lead.md", """# CURRICULUM VITAE: DR. AMINA KADIR
**Proposed Role:** Team Leader / Principal Systems Architect  
**Nationality:** Kenyan  
**Years of Experience:** 16 Years  
**Current Title:** Senior Partner & Chief Systems Architect, Acme Technology Consulting  
**Contact:** amina.kadir@acme-consulting.org  

### Executive Profile
Dr. Amina Kadir is an internationally recognized enterprise systems architect and environmental informatics specialist with over 16 years of leadership experience designing national-scale data infrastructures across East and Central Africa. She has served as Chief Technical Advisor and Principal Architect on 14 major multi-lateral donor programs funded by UNDP, World Bank, African Development Bank, and FCDO.

### Education
- **PhD in Computer Science & Environmental Informatics**, University of Oxford, 2012
- **MSc in Distributed Computing Systems**, University of Nairobi, 2008 (First Class Honors)
- **BSc in Electrical & Information Engineering**, University of Nairobi, 2005

### Core Technical Competencies
- Enterprise Software Architecture & Cloud Migration (AWS, Azure, Render, Sovereign Cloud)
- Hydrological & Geospatial Data Modeling (PostgreSQL/PostGIS, GeoServer, OGC Standards)
- Multi-Hazard Early Warning Systems (MHEWS) design
- Donor Procurement & Technical Lead on UNDP, World Bank, and EU tenders
- Certified SCRUM Master & TOGAF 9.2 Enterprise Architect

### Selected Relevant Experience
1. **Principal Architect - Kenya National Drought Early Warning System (UNDP / NDMA, 2023-2025):**
   Led the architectural blueprint and full software engineering lifecycle for an automated drought observation platform monitoring 23 arid counties. Implemented real-time anomaly detection rules and integrated SMS alerting for 45,000 community leaders.
2. **Lead Systems Specialist - Lake Victoria Basin Water Quality Monitoring Portal (World Bank, 2020-2022):**
   Architected a regional IoT sensor ingestion system across Uganda, Kenya, and Tanzania. Designed the data exchange API handling 2.5 million daily sensor readings.
"""),
        ("CV_Marcus_Chen_Lead_Data_Engineer.md", """# CURRICULUM VITAE: MARCUS CHEN
**Proposed Role:** Senior Cloud Data Engineer & Pipeline Architect  
**Nationality:** British  
**Years of Experience:** 10 Years  
**Contact:** marcus.chen@acme-consulting.org  

### Executive Profile
Senior backend and data platform engineer specializing in high-throughput streaming pipelines, distributed PostgreSQL databases, Docker containerization, and automated ETL workflows for government and humanitarian data systems.

### Education
- **BSc (Hons) in Software Engineering**, Imperial College London, 2015

### Core Technical Competencies
- Languages: Python (FastAPI, PySpark, SQLAlchemy, Celery), SQL, Go
- Data Stores: PostgreSQL (PostGIS, pgvector), Redis, OpenSearch
- Cloud & DevOps: Docker, Kubernetes, Render, GitHub Actions CI/CD
- Message Brokers & Streaming: Apache Kafka, RabbitMQ, WebSockets
- Third-Party APIs: Telecom SMS gateways, Thrivewave API, REST, GraphQL

### Selected Relevant Experience
1. **Senior Data Engineer - Kenya National Drought Early Warning System (2023-2025):**
   Built the asynchronous Python/FastAPI data ingestion engine processing radar and gauge feeds. Achieved 99.95% pipeline uptime.
2. **Data Pipeline Lead - Regional Disease Surveillance Exchange (2021-2023):**
   Implemented HL7/FHIR microservices and automated SMS emergency dispatch engine via telecom gateway connections.
"""),
        ("CV_Sarah_Jenkins_MEL_Specialist.md", """# CURRICULUM VITAE: SARAH JENKINS
**Proposed Role:** Monitoring, Evaluation & Learning (MEL) Specialist  
**Nationality:** American / Kenyan Resident  
**Years of Experience:** 12 Years  
**Contact:** sarah.jenkins@acme-consulting.org  

### Executive Profile
Senior MEL specialist with 12 years of hands-on experience designing quantitative monitoring frameworks, indicator verification matrices, and stakeholder capacity-building curricula for USAID, UNDP, and FCDO programs in Africa.

### Education
- **Master of Public Administration (MPA)**, Columbia University SIPA, 2013
- **BA in International Development**, University of California, Berkeley, 2010

### Key Credentials
- Extensive expertise with UNDP Results-Based Management (RBM) and USAID Collaborating, Learning, and Adapting (CLA) frameworks.
- Led training and institutional capacity workshops for over 600 public sector personnel across Kenya, Uganda, and Rwanda.
"""),
        ("CV_David_Ochieng_Cybersecurity_Specialist.md", """# CURRICULUM VITAE: DAVID OCHIENG
**Proposed Role:** Information Security & Governance Lead  
**Nationality:** Kenyan  
**Years of Experience:** 9 Years  
**Contact:** david.ochieng@acme-consulting.org  

### Executive Profile
Certified Information Systems Security Professional (CISSP) specializing in public sector cloud security architectures, ISO 27001 audit compliance, sovereign data sovereignty, and role-based access control.

### Education & Certifications
- **BSc in Computer Security & Forensics**, Strathmore University, 2016
- **CISSP** (Certified Information Systems Security Professional), (ISC)², 2019
- **ISO/IEC 27001 Lead Auditor**, BSI Group, 2021
""")
    ]

    for fname, content in cvs:
        with open(CVS_DIR / fname, "w") as f:
            f.write(content)
        print(f"Created CV Markdown: {fname}")

def generate_mock_past_proposals():
    p1 = """# PAST WINNING PROPOSAL EXCERPT: KENYA DROUGHT EARLY WARNING SYSTEM
**Client:** United Nations Development Programme (UNDP) & National Drought Management Authority (NDMA)  
**Contract Value:** USD 380,000  
**Period:** 2023 - 2025  
**Win Status:** WON & Successfully Delivered  
**Sector:** Climate Informatics, IoT, & Early Warning Platforms  

### Architectural Methodology & Innovation
Our solution delivered an integrated 3-tier architecture:
1. **Sensor & Satellite Ingestion Layer:** Python microservices pulling Doppler radar, CHIRPS rainfall rasters, and telemetry from 85 automatic weather stations.
2. **Predictive Anomaly Engine:** PostgreSQL/PostGIS database calculating Standardized Precipitation Indices (SPI) and trigger thresholds.
3. **Multi-Channel Alert Gateway:** Real-time SMS broadcast platform delivering localized drought warnings to 45,000 pastoralists in English and Swahili.

### Demonstrated Outcomes
- Reduced alert dissemination time from 14 days to under 4 minutes.
- Evaluated as "Exemplary Performance" by UNDP Project Evaluation Review (2025).
"""
    with open(PROPOSALS_DIR / "Past_Proposal_Kenya_Drought_Early_Warning_System.md", "w") as f:
        f.write(p1)

    p2 = """# PAST WINNING PROPOSAL EXCERPT: RWANDA DIGITAL HEALTH DATA EXCHANGE
**Client:** World Bank & Ministry of Health Rwanda  
**Contract Value:** USD 620,000  
**Period:** 2022 - 2024  
**Win Status:** WON & Successfully Delivered  
**Sector:** Digital Health Interoperability & FHIR  

### Architectural Methodology
Implemented an open-standard Health Information Exchange based on HL7 FHIR Release 4 and OpenHIE architecture. Integrated Master Patient Index (MPI) with national identity verification and zero data breaches across 2 years of continuous operation.
"""
    with open(PROPOSALS_DIR / "Past_Proposal_Rwanda_Digital_Health_Platform.md", "w") as f:
        f.write(p2)
    print("Created Past Proposals.")

def generate_mock_templates():
    create_styled_docx(
        title="[ORGANIZATION NAME] TECHNICAL PROPOSAL TEMPLATE",
        subtitle="Standard Response Template for Donor and Government RFPs",
        sections=[
            ("1. Executive Summary", "[Insert concise executive summary highlighting consortium value proposition and client alignment]"),
            ("2. Context & Problem Understanding", "[Insert rigorous analysis of the TOR context, operational challenges, and strategic vision]"),
            ("3. Proposed Technical Methodology", "[Insert modular architecture: Ingestion, Analytics, Dissemination, Security]"),
            ("4. Work Plan & Deliverables", "[Insert phased milestone schedule with clear deliverables and acceptance criteria]"),
            ("5. Staffing Matrix & Key Personnel", "[Insert staffing matrix table mapping named experts to required TOR roles]"),
            ("6. Past Performance & Institutional Precedents", "[Insert verified past performance references and relevant delivery metrics]")
        ],
        output_path=TEMPLATES_DIR / "standard_technical_proposal_template.docx"
    )

    create_styled_docx(
        title="[ORGANIZATION NAME] EXPRESSION OF INTEREST (EOI) TEMPLATE",
        subtitle="Standard Pre-Qualification and Shortlisting Template",
        sections=[
            ("1. Statement of Capability", "[Insert corporate profile, institutional history, and regional experience]"),
            ("2. Technical Relevance to Assignment", "[Insert overview of methodologies and domain expertise]"),
            ("3. Key Personnel Available", "[Insert summary bios of proposed project leadership]"),
            ("4. Institutional Track Record", "[Insert summary of 3 similar contracts completed in the past 5 years]")
        ],
        output_path=TEMPLATES_DIR / "eoi_expression_of_interest_template.docx"
    )
    print("Created DOCX Proposal Templates.")

if __name__ == "__main__":
    generate_mock_tenders()
    generate_mock_cvs()
    generate_mock_past_proposals()
    generate_mock_templates()
    print("All mock documents successfully generated.")

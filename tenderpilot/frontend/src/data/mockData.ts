export interface Tender {
  id: string;
  referenceNumber: string;
  title: string;
  agency: string;
  source: string;
  region: string;
  country: string;
  sector: string;
  deadline: string;
  budgetEst: string;
  fitScore: number;
  fitReason: string;
  summary: string;
  requirements: string[];
  matchedConsultants: string[];
  matchedProposals: string[];
}

export interface KBDocument {
  id: string;
  name: string;
  type: 'CV' | 'Past Proposal' | 'Capability Statement';
  size: string;
  uploadedAt: string;
  status: 'Parsed & Indexed' | 'Processing';
  consultantName?: string;
  keySkills: string[];
  summary: string;
}

export interface ProposalSection {
  id: string;
  title: string;
  content: string;
  citations: {
    sourceDoc: string;
    excerpt: string;
    pageRef?: string;
  }[];
}

export interface GeneratedProposal {
  id: string;
  tenderId: string;
  tenderTitle: string;
  agency: string;
  createdAt: string;
  status: 'Draft' | 'Under Review' | 'Approved';
  version: string;
  team: string[];
  sections: ProposalSection[];
}

export const initialDocuments: KBDocument[] = [
  {
    id: 'doc-1',
    name: 'Dr. Sarah Chen - Principal Digital Health Architect CV.pdf',
    type: 'CV',
    size: '1.4 MB',
    uploadedAt: 'Today, 10:15 AM',
    status: 'Parsed & Indexed',
    consultantName: 'Dr. Sarah Chen',
    keySkills: ['FHIR / HL7', 'DHIS2', 'National Health Architecture', 'East Africa (Kenya, Uganda)'],
    summary: '14+ years designing national health information exchanges and digital health systems for WHO, UNICEF, and ministries of health.',
  },
  {
    id: 'doc-2',
    name: 'Eng. David Ochieng - Lead Enterprise Infrastructure Consultant CV.pdf',
    type: 'CV',
    size: '1.1 MB',
    uploadedAt: 'Yesterday, 3:40 PM',
    status: 'Parsed & Indexed',
    consultantName: 'Eng. David Ochieng',
    keySkills: ['Cloud Infrastructure', 'Public Sector IT Reform', 'Procurement Specs', 'ISO 27001'],
    summary: '12+ years in large-scale government datacenter modernization, cybersecurity compliance, and cloud migration.',
  },
  {
    id: 'doc-3',
    name: 'UNOPS PFM & Financial Reporting Automation - Final Technical Proposal.docx',
    type: 'Past Proposal',
    size: '3.8 MB',
    uploadedAt: '2 days ago',
    status: 'Parsed & Indexed',
    keySkills: ['Public Financial Management', 'IFMIS Integration', 'Treasury Single Account', 'Change Management'],
    summary: 'Winning $1.8M technical proposal for digitizing treasury reporting and automated variance reconciliation across 14 sub-national agencies.',
  },
  {
    id: 'doc-4',
    name: 'Apex Advisory Group - 2026 Corporate Capability Statement.pdf',
    type: 'Capability Statement',
    size: '2.5 MB',
    uploadedAt: '3 days ago',
    status: 'Parsed & Indexed',
    keySkills: ['Public Sector Modernization', 'Monitoring & Evaluation', 'Donor Compliance', 'East & Southern Africa'],
    summary: 'Overview of firm track record: 42 projects completed with UN Secretariat, World Bank, and USAID since 2018.',
  },
];

export const initialTenders: Tender[] = [
  {
    id: 'tender-ungm-89104',
    referenceNumber: 'UNDP-KEN-2026-0042',
    title: 'Consultancy for National Digital Health Strategy & Interoperability Architecture',
    agency: 'UNDP Kenya / Ministry of Health',
    source: 'United Nations Global Marketplace (UNGM)',
    region: 'East Africa',
    country: 'Kenya',
    sector: 'Digital Transformation & IT',
    deadline: '2026-11-28 (21 days left)',
    budgetEst: '$250,000 - $350,000',
    fitScore: 94,
    fitReason: 'Direct match with Dr. Sarah Chen’s 14-year DHIS2/national architecture track record and past 2025 MOH technical advisory.',
    summary: 'The United Nations Development Programme (UNDP) in Kenya seeks a firm to design the multi-tier national interoperability framework, API standards, and transition roadmap for health registries.',
    requirements: [
      'Proven firm track record of at least 3 donor-funded digital health frameworks in Sub-Saharan Africa.',
      'Team Lead with minimum 10 years experience in healthcare enterprise architecture and HL7/FHIR protocols.',
      'Knowledge of Kenyan public health sector governance and donor reporting standards.',
      'Delivery of final technical roadmap within 180 days of contract signing.'
    ],
    matchedConsultants: ['Dr. Sarah Chen (Lead Architect, 100% match)', 'Eng. David Ochieng (Security & Cloud Specialist)'],
    matchedProposals: ['UNOPS PFM & Financial Reporting Automation (91% methodology reuse)'],
  },
  {
    id: 'tender-ungm-89211',
    referenceNumber: 'UNICEF-HQ-2026-119',
    title: 'Modernization of Sub-National Supply Chain Tracking & Variance Analytics',
    agency: 'UNICEF Supply Division',
    source: 'United Nations Global Marketplace (UNGM)',
    region: 'East Africa',
    country: 'Uganda & Rwanda',
    sector: 'Public Financial Management',
    deadline: '2026-12-05 (28 days left)',
    budgetEst: '$400,000 - $600,000',
    fitScore: 88,
    fitReason: 'Strong alignment with your UNOPS PFM reporting proposal (doc-3) and inventory variance reconciliation methodology.',
    summary: 'UNICEF seeks an experienced management and systems consultancy to implement automated reconciliation for vaccine and nutrition supply movements across district warehouses.',
    requirements: [
      'Firm must demonstrate past delivery on ERP or automated reconciliation systems for UN agencies.',
      'Change management methodology and multilingual user training plan.',
      'Compliance with UN standard data governance and ISO 27001 data protection protocols.'
    ],
    matchedConsultants: ['Eng. David Ochieng (Infrastructure & ISO 27001 Lead)'],
    matchedProposals: ['UNOPS PFM & Financial Reporting Automation.docx (95% match)'],
  },
  {
    id: 'tender-ungm-88902',
    referenceNumber: 'WHO-AFRO-2026-081',
    title: 'Technical Advisory for Disease Surveillance Early Warning Platform',
    agency: 'World Health Organization (WHO AFRO)',
    source: 'United Nations Global Marketplace (UNGM)',
    region: 'Pan-African',
    country: 'Regional Hub (Brazzaville/Nairobi)',
    sector: 'Healthcare & Life Sciences',
    deadline: '2026-11-20 (13 days left)',
    budgetEst: '$180,000 - $220,000',
    fitScore: 82,
    fitReason: 'Consultant Dr. Sarah Chen holds direct prior WHO advisory credentials and epidemiology data pipeline experience.',
    summary: 'Formulation of technical specifications and integration protocols for regional epidemic early warning data feeds connecting 12 member states.',
    requirements: [
      'Experience in multi-country public health surveillance systems.',
      'Familiarity with WHO AFRO digital health guidelines and open-source stacks (DHIS2, SORMAS).',
      'Delivery of technical blueprint and prototype data pipelines.'
    ],
    matchedConsultants: ['Dr. Sarah Chen (Lead Advisor)'],
    matchedProposals: ['Apex Advisory Group - 2026 Corporate Capability Statement'],
  },
  {
    id: 'tender-wb-76291',
    referenceNumber: 'WB-IDA-2026-904',
    title: 'Feasibility Study for Solar Mini-Grid Electrification in Off-Grid Counties',
    agency: 'World Bank Group / Energy Sector',
    source: 'World Bank Procurement',
    region: 'East Africa',
    country: 'Kenya',
    sector: 'Energy & Infrastructure',
    deadline: '2026-12-15 (38 days left)',
    budgetEst: '$500,000',
    fitScore: 46,
    fitReason: 'Low score: Firm capability documents lack specialized electrical engineering and renewable mini-grid past project records.',
    summary: 'Comprehensive geotechnical, community demand, and tariff feasibility analysis for 45 isolated rural trade centers.',
    requirements: [
      '5+ years in off-grid solar engineering and grid tariff structuring.',
      'Licensed professional electrical engineers on team.',
      'Environmental and Social Impact Assessment (ESIA) certification.'
    ],
    matchedConsultants: [],
    matchedProposals: [],
  },
];

export const initialProposals: GeneratedProposal[] = [
  {
    id: 'prop-001',
    tenderId: 'tender-ungm-89104',
    tenderTitle: 'Consultancy for National Digital Health Strategy & Interoperability Architecture',
    agency: 'UNDP Kenya / Ministry of Health',
    createdAt: 'Today, 11:30 AM',
    status: 'Draft',
    version: 'v1.0 (AI Draft)',
    team: ['Dr. Sarah Chen (Team Lead)', 'Eng. David Ochieng (Systems Architect)'],
    sections: [
      {
        id: 'sec-1',
        title: '1. Executive Summary & Understanding of the Assignment',
        content: `Apex Advisory Group is pleased to submit this Technical Proposal in response to UNDP Kenya RFP No. UNDP-KEN-2026-0042. Our understanding of the assignment is centered on establishing a resilient, scalable, and standards-compliant National Digital Health Interoperability Architecture that connects disparate health facility registries, national reporting systems, and clinical databases under the stewardship of the Ministry of Health.

Drawing directly upon our team's track record in delivering multi-tiered national architectures across East Africa, our proposed approach emphasizes pragmatic standards adoption (HL7 FHIR Release 4 and OpenHIE guidelines), strong data sovereignty, and sustainable institutional capacity building. We combine top-tier technical proficiency with on-the-ground familiarity with Kenya's devolved healthcare operational environment.`,
        citations: [
          {
            sourceDoc: 'Apex Advisory Group - 2026 Corporate Capability Statement.pdf',
            excerpt: '42 projects delivered with UN and bilateral agencies across East Africa since 2018.',
            pageRef: 'Page 3, Section 2.1',
          },
          {
            sourceDoc: 'Dr. Sarah Chen - Principal Digital Health Architect CV.pdf',
            excerpt: '14+ years designing national health information architectures and OpenHIE registries.',
            pageRef: 'Page 1, Summary',
          },
        ],
      },
      {
        id: 'sec-2',
        title: '2. Technical Approach & Proposed Methodology',
        content: `Our technical approach adopts a five-phase iterative framework tested and refined across prior donor-funded institutional modernization projects:

Phase 1: Baseline Architecture Assessment & Stakeholder Mapping (Weeks 1-4)
We will conduct an exhaustive inventory of existing digital registries, reviewing data models, API endpoints, and authentication policies against international standards (FHIR R4, ISO 27001).

Phase 2: Target Interoperability Framework & Specification (Weeks 5-10)
Design of the shared Core Data Dictionary, Master Patient Index (MPI) governance, and secure RESTful middleware specifications ensuring seamless sync with DHIS2 national dashboards.

Phase 3: Prototype Middleware Testing & Security Hardening (Weeks 11-16)
Development of sandboxed reference implementations, simulated stress testing for high-concurrency facility reporting, and role-based access control compliance.

Phase 4: Transition Roadmap, Costing & Governance Charter (Weeks 17-22)
Formulation of phased migration blueprints, operational risk mitigations, and total cost of ownership models for ministerial adoption.

Phase 5: Institutional Knowledge Transfer & Final Dissemination (Weeks 23-26)
Structured training workshops for Ministry of Health technical teams and comprehensive handover documentation.`,
        citations: [
          {
            sourceDoc: 'UNOPS PFM & Financial Reporting Automation - Final Technical Proposal.docx',
            excerpt: 'Proven five-phase iterative governance and systems integration framework.',
            pageRef: 'Page 14, Technical Approach',
          },
          {
            sourceDoc: 'Dr. Sarah Chen - Principal Digital Health Architect CV.pdf',
            excerpt: 'Direct expertise in DHIS2 and OpenHIE interoperability layer design.',
            pageRef: 'Page 2, Experience',
          },
        ],
      },
      {
        id: 'sec-3',
        title: '3. Team Composition & Key Personnel Qualifications',
        content: `To ensure uninterrupted delivery of exceptional quality, Apex Advisory Group proposes a compact, highly specialized team:

- Team Leader / Principal Health Architect: Dr. Sarah Chen brings over 14 years of direct experience leading enterprise architecture for WHO, UNICEF, and ministries of health. She has published widely on FHIR-based exchange and served as Lead Technical Advisor for Kenya's initial digital health blueprint in 2024.

- Enterprise Infrastructure & Security Lead: Eng. David Ochieng contributes 12+ years in cloud infrastructure, high-availability datacenter operations, and ISO 27001 security compliance across public sector institutions in East Africa.`,
        citations: [
          {
            sourceDoc: 'Dr. Sarah Chen - Principal Digital Health Architect CV.pdf',
            excerpt: 'Lead Technical Advisor for Kenya digital health blueprint 2024.',
            pageRef: 'Page 1',
          },
          {
            sourceDoc: 'Eng. David Ochieng - Lead Enterprise Infrastructure Consultant CV.pdf',
            excerpt: '12+ years in public sector cloud architecture and ISO 27001 compliance.',
            pageRef: 'Page 2',
          },
        ],
      },
      {
        id: 'sec-4',
        title: '4. Firm Track Record & Past Performance Verification',
        content: `Apex Advisory Group has completed 42 high-impact advisory contracts across the East African region. Relevant comparable engagements include:

1. UNOPS Regional Financial & Systems Integration (2025): Deployed automated data aggregation and variance tracking across 14 sub-national agencies on time and under budget.
2. WHO AFRO Epidemiological Data Exchange Assessment (2024): Formulated multi-country data exchange protocols and API standardization.

All cited references can be verified directly against our archived project completion certificates and client references.`,
        citations: [
          {
            sourceDoc: 'UNOPS PFM & Financial Reporting Automation - Final Technical Proposal.docx',
            excerpt: 'Winning $1.8M technical proposal for digitizing reporting across 14 sub-national agencies.',
            pageRef: 'Executive Overview',
          },
          {
            sourceDoc: 'Apex Advisory Group - 2026 Corporate Capability Statement.pdf',
            excerpt: 'Verified completion certificates for UN and bilateral agencies since 2018.',
            pageRef: 'Page 7, References',
          },
        ],
      },
    ],
  },
];

export type PipelineStage =
  | 'found'
  | 'extracted'
  | 'scored'
  | 'matched'
  | 'drafted'
  | 'checked'
  | 'review_sent'
  | 'bid'
  | 'no_bid'
  | 'submitted_by_human';

export interface TOREvaluationCriterion {
  name: string;
  weight: number;
}

export interface TORDeliverable {
  title: string;
  dueWeek: number;
}

export interface TOR {
  donor: string;
  deadline: string;
  budget: string;
  eligibility: string[];
  evaluationCriteria: TOREvaluationCriterion[];
  requiredExpertise: string[];
  deliverables: TORDeliverable[];
}

export interface DecisionRecord {
  decision: 'bid' | 'no_bid';
  decidedBy: string;
  decidedAt: string;
  notes?: string;
}

export interface ConsultantCoverage {
  consultantId: string;
  consultantName: string;
  matchPercentage: number;
  expertiseCovered: string[];
}

export interface TeamMatchingResult {
  assigned: ConsultantCoverage[];
  gaps: string[];
}

export interface OutcomeFeedback {
  outcome: 'won' | 'lost' | 'pending';
  markedAt?: string;
  learningNote?: string;
}

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
  recommendation: 'bid' | 'no_bid';
  reasons: {
    strengths: string[];
    risks: string[];
  };
  summary: string;
  stage: PipelineStage;
  tor: TOR;
  teamMatching: TeamMatchingResult;
  decision?: DecisionRecord;
  submittedAt?: string;
  outcome?: OutcomeFeedback;
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

export interface GroundingClaim {
  id: string;
  claimText: string;
  isSupported: boolean;
  sourceDoc?: string;
  excerpt?: string;
  pageRef?: string;
}

export interface ComplianceCheckItem {
  id: string;
  requirement: string;
  status: 'met' | 'unmet' | 'needs_review';
  notes?: string;
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
  templateType: 'technical' | 'eoi';
  version: string;
  team: string[];
  sections: ProposalSection[];
  claims: GroundingClaim[];
  compliance: ComplianceCheckItem[];
  checksAcknowledged: boolean;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: 'system' | 'user';
  actorName: string;
  event:
    | 'found'
    | 'extracted'
    | 'scored'
    | 'team_matched'
    | 'draft_generated'
    | 'edited'
    | 'check_run'
    | 'decision_made'
    | 'review_sent'
    | 'submitted_by_human'
    | 'outcome_recorded';
  tenderId?: string;
  tenderTitle?: string;
  source: string;
  details: string;
}

export const initialDocuments: KBDocument[] = [
  {
    id: 'doc-1',
    name: 'Dr. Sarah Chen - Principal Digital Health Architect CV.pdf',
    type: 'CV',
    size: '1.4 MB',
    uploadedAt: '2026-11-06 10:15',
    status: 'Parsed & Indexed',
    consultantName: 'Dr. Sarah Chen',
    keySkills: ['FHIR / HL7', 'DHIS2', 'National Health Architecture', 'Health Information Exchange'],
    summary: '14 years designing national health information exchanges and digital health systems for WHO, UNICEF, and ministries of health.',
  },
  {
    id: 'doc-2',
    name: 'Eng. David Ochieng - Lead Enterprise Infrastructure Consultant CV.pdf',
    type: 'CV',
    size: '1.1 MB',
    uploadedAt: '2026-11-06 15:40',
    status: 'Parsed & Indexed',
    consultantName: 'Eng. David Ochieng',
    keySkills: ['Cloud Infrastructure', 'Public Sector IT Reform', 'Procurement Specs', 'ISO 27001'],
    summary: '12 years in large-scale government datacenter modernization, cybersecurity compliance, and cloud migration.',
  },
  {
    id: 'doc-3',
    name: 'UNOPS PFM & Financial Reporting Automation - Final Technical Proposal.docx',
    type: 'Past Proposal',
    size: '3.8 MB',
    uploadedAt: '2026-11-05 09:20',
    status: 'Parsed & Indexed',
    keySkills: ['Public Financial Management', 'IFMIS Integration', 'Treasury Single Account', 'Change Management'],
    summary: 'Winning 1.8M USD technical proposal for automated treasury reporting and variance reconciliation across 14 sub-national agencies.',
  },
  {
    id: 'doc-4',
    name: 'Apex Advisory Group - 2026 Corporate Capability Statement.pdf',
    type: 'Capability Statement',
    size: '2.5 MB',
    uploadedAt: '2026-11-04 11:00',
    status: 'Parsed & Indexed',
    keySkills: ['Public Sector Modernization', 'Monitoring & Evaluation', 'Donor Compliance', 'East Africa'],
    summary: '42 advisory contracts completed with UN Secretariat, World Bank, and USAID since 2018.',
  },
];

export const initialTenders: Tender[] = [
  {
    id: 'tender-1',
    referenceNumber: 'UNDP-KEN-2026-0042',
    title: 'Consultancy for National Digital Health Strategy & Interoperability Architecture',
    agency: 'UNDP Kenya',
    source: 'UNGM',
    region: 'East Africa',
    country: 'Kenya',
    sector: 'Digital Transformation & IT',
    deadline: '2026-11-28',
    budgetEst: '$250,000 - $350,000',
    fitScore: 94,
    recommendation: 'bid',
    reasons: {
      strengths: [
        'Dr. Sarah Chen meets all 10+ years health architecture criteria (14 years verified).',
        'Direct experience with MOH Kenya digital health blueprint.',
        'High methodology overlap (91%) with UNOPS PFM systems delivery model.'
      ],
      risks: [
        '180-day delivery schedule requires dedicated full-time deployment of two senior experts.'
      ]
    },
    summary: 'Design of multi-tier national interoperability framework, API standards, and transition roadmap for health registries.',
    stage: 'drafted',
    tor: {
      donor: 'UNDP Kenya / Ministry of Health',
      deadline: '2026-11-28',
      budget: '$250,000 - $350,000',
      eligibility: [
        'Firm registered for at least 5 years with valid tax compliance certificate.',
        'No conflict of interest with MOH software procurement vendors.'
      ],
      evaluationCriteria: [
        { name: 'Technical Approach & Methodology', weight: 40 },
        { name: 'Team Qualifications & Competency', weight: 35 },
        { name: 'Firm Experience in Comparable Projects', weight: 25 },
      ],
      requiredExpertise: [
        'Enterprise Health Architecture & FHIR Protocols',
        'National Registry Interoperability & DHIS2',
        'Cloud Infrastructure & ISO 27001 Security'
      ],
      deliverables: [
        { title: 'Inception Report and Architecture Assessment', dueWeek: 4 },
        { title: 'Draft Interoperability Framework & Standards', dueWeek: 12 },
        { title: 'Final Blueprint, Migration Roadmap & Training Handover', dueWeek: 24 }
      ]
    },
    teamMatching: {
      assigned: [
        {
          consultantId: 'doc-1',
          consultantName: 'Dr. Sarah Chen',
          matchPercentage: 96,
          expertiseCovered: [
            'Enterprise Health Architecture & FHIR Protocols',
            'National Registry Interoperability & DHIS2'
          ]
        },
        {
          consultantId: 'doc-2',
          consultantName: 'Eng. David Ochieng',
          matchPercentage: 92,
          expertiseCovered: [
            'Cloud Infrastructure & ISO 27001 Security'
          ]
        }
      ],
      gaps: []
    },
    decision: {
      decision: 'bid',
      decidedBy: 'Romano Juma',
      decidedAt: '2026-11-07 09:30',
      notes: 'Strategic alignment with firm digital health roadmap.'
    }
  },
  {
    id: 'tender-2',
    referenceNumber: 'UNICEF-HQ-2026-119',
    title: 'Modernization of Sub-National Supply Chain Tracking & Variance Analytics',
    agency: 'UNICEF Supply Division',
    source: 'UNGM',
    region: 'East Africa',
    country: 'Uganda',
    sector: 'Public Financial Management',
    deadline: '2026-12-05',
    budgetEst: '$400,000 - $600,000',
    fitScore: 88,
    recommendation: 'bid',
    reasons: {
      strengths: [
        'Strong alignment with UNOPS PFM reporting methodology (doc-3).',
        'Eng. David Ochieng covers cloud and security requirements.'
      ],
      risks: [
        'Requires French and English reporting documentation; French translation resource needed.'
      ]
    },
    summary: 'Automated reconciliation for vaccine and nutrition supply movements across district warehouses.',
    stage: 'scored',
    tor: {
      donor: 'UNICEF',
      deadline: '2026-12-05',
      budget: '$400,000 - $600,000',
      eligibility: [
        'Prior delivery on ERP or automated reconciliation for UN agency.',
        'ISO 27001 security certification.'
      ],
      evaluationCriteria: [
        { name: 'Proposed Solution Architecture', weight: 45 },
        { name: 'Personnel & Logistics Experience', weight: 35 },
        { name: 'Past Performance with UN Entities', weight: 20 }
      ],
      requiredExpertise: [
        'Public Financial Management & Variance Analytics',
        'Sub-national Logistics & Warehouse Systems',
        'ISO 27001 Data Security'
      ],
      deliverables: [
        { title: 'Baseline Architecture Audit', dueWeek: 3 },
        { title: 'Automated Analytics Engine Specification', dueWeek: 10 },
        { title: 'Training Workshops & Rollout Plan', dueWeek: 16 }
      ]
    },
    teamMatching: {
      assigned: [
        {
          consultantId: 'doc-2',
          consultantName: 'Eng. David Ochieng',
          matchPercentage: 88,
          expertiseCovered: ['ISO 27001 Data Security']
        }
      ],
      gaps: ['Sub-national Logistics & Warehouse Systems']
    }
  },
  {
    id: 'tender-3',
    referenceNumber: 'WHO-AFRO-2026-081',
    title: 'Technical Advisory for Disease Surveillance Early Warning Platform',
    agency: 'WHO AFRO',
    source: 'UNGM',
    region: 'Pan-African',
    country: 'Regional Hub',
    sector: 'Healthcare & Life Sciences',
    deadline: '2026-11-20',
    budgetEst: '$180,000 - $220,000',
    fitScore: 82,
    recommendation: 'bid',
    reasons: {
      strengths: [
        'Dr. Sarah Chen holds direct prior WHO advisory credentials.',
        'Firm capability deck cites 4 completed regional surveillance contracts.'
      ],
      risks: [
        'Tight timeline: proposal deadline is in 13 days.'
      ]
    },
    summary: 'Technical specifications and integration protocols for regional epidemic early warning data feeds.',
    stage: 'matched',
    tor: {
      donor: 'WHO AFRO',
      deadline: '2026-11-20',
      budget: '$180,000 - $220,000',
      eligibility: [
        'Minimum 3 completed public health contracts in Africa in past 5 years.'
      ],
      evaluationCriteria: [
        { name: 'Technical Methodology', weight: 50 },
        { name: 'Lead Expert Profile', weight: 30 },
        { name: 'Cost Competitiveness', weight: 20 }
      ],
      requiredExpertise: [
        'Epidemiological Data Pipelines',
        'Open-source Health Stacks (DHIS2, SORMAS)'
      ],
      deliverables: [
        { title: 'Technical Blueprint', dueWeek: 6 },
        { title: 'Data Feed Integration Protocols', dueWeek: 12 }
      ]
    },
    teamMatching: {
      assigned: [
        {
          consultantId: 'doc-1',
          consultantName: 'Dr. Sarah Chen',
          matchPercentage: 94,
          expertiseCovered: ['Epidemiological Data Pipelines', 'Open-source Health Stacks (DHIS2, SORMAS)']
        }
      ],
      gaps: []
    }
  },
  {
    id: 'tender-4',
    referenceNumber: 'WB-IDA-2026-904',
    title: 'Feasibility Study for Solar Mini-Grid Electrification in Off-Grid Counties',
    agency: 'World Bank',
    source: 'World Bank Procurement',
    region: 'East Africa',
    country: 'Kenya',
    sector: 'Energy & Infrastructure',
    deadline: '2026-12-15',
    budgetEst: '$500,000',
    fitScore: 46,
    recommendation: 'no_bid',
    reasons: {
      strengths: [
        'Regional presence in Kenya and familiarity with county government structures.'
      ],
      risks: [
        'Firm repository has 0 past proposals in off-grid solar or renewable energy.',
        'Missing licensed electrical engineers on staff roster.',
        'Requires certified ESIA assessors which firm does not employ.'
      ]
    },
    summary: 'Geotechnical, demand forecasting, and tariff feasibility analysis for 45 isolated mini-grid sites.',
    stage: 'no_bid',
    tor: {
      donor: 'World Bank Group',
      deadline: '2026-12-15',
      budget: '$500,000',
      eligibility: [
        'Certified Environmental and Social Impact Assessment (ESIA) firm licence.',
        'Minimum 5 mini-grid feasibility studies completed in Sub-Saharan Africa.'
      ],
      evaluationCriteria: [
        { name: 'Engineering & Geotechnical Capability', weight: 40 },
        { name: 'Economic & Tariff Modeling', weight: 30 },
        { name: 'Personnel Credentials', weight: 30 }
      ],
      requiredExpertise: [
        'Off-grid Solar Engineering',
        'Power Tariff Financial Modeling',
        'ESIA Environmental Impact Certification'
      ],
      deliverables: [
        { title: 'Inception & Site Selection Report', dueWeek: 4 },
        { title: 'Detailed Engineering & Tariff Assessment', dueWeek: 16 }
      ]
    },
    teamMatching: {
      assigned: [],
      gaps: [
        'Off-grid Solar Engineering',
        'Power Tariff Financial Modeling',
        'ESIA Environmental Impact Certification'
      ]
    },
    decision: {
      decision: 'no_bid',
      decidedBy: 'Romano Juma',
      decidedAt: '2026-11-07 08:45',
      notes: 'Out of firm capability scope. High risk of technical disqualification.'
    }
  }
];

export const initialProposals: GeneratedProposal[] = [
  {
    id: 'prop-1',
    tenderId: 'tender-1',
    tenderTitle: 'Consultancy for National Digital Health Strategy & Interoperability Architecture',
    agency: 'UNDP Kenya',
    createdAt: '2026-11-07 11:30',
    status: 'Draft',
    templateType: 'technical',
    version: 'v1.0 (Draft)',
    team: ['Dr. Sarah Chen (Lead Architect)', 'Eng. David Ochieng (Security Specialist)'],
    checksAcknowledged: false,
    claims: [
      {
        id: 'c-1',
        claimText: 'Apex Advisory Group has delivered 42 advisory contracts across East Africa since 2018.',
        isSupported: true,
        sourceDoc: 'Apex Advisory Group - 2026 Corporate Capability Statement.pdf',
        excerpt: '42 advisory contracts completed with UN Secretariat, World Bank, and USAID since 2018.',
        pageRef: 'Page 3'
      },
      {
        id: 'c-2',
        claimText: 'Dr. Sarah Chen has 14 years experience leading health architecture for WHO and UNICEF.',
        isSupported: true,
        sourceDoc: 'Dr. Sarah Chen - Principal Digital Health Architect CV.pdf',
        excerpt: '14 years designing national health information exchanges and digital health systems for WHO, UNICEF...',
        pageRef: 'Summary'
      },
      {
        id: 'c-3',
        claimText: 'The proposed middleware guarantees 99.999% uptime on Tier-3 government datacenters.',
        isSupported: false
      }
    ],
    compliance: [
      {
        id: 'comp-1',
        requirement: 'Firm registered for at least 5 years with valid tax compliance certificate',
        status: 'met',
        notes: 'Certificate on file in corporate records (issued 2018).'
      },
      {
        id: 'comp-2',
        requirement: 'No conflict of interest with MOH software procurement vendors',
        status: 'met',
        notes: 'Signed declaration prepared.'
      },
      {
        id: 'comp-3',
        requirement: 'Submission of 3 client reference letters from comparable contracts',
        status: 'needs_review',
        notes: 'Need 3rd letter from WHO regional office confirmed.'
      }
    ],
    sections: [
      {
        id: 'sec-1',
        title: '1. Executive Summary & Understanding of Assignment',
        content: `Apex Advisory Group submits this Technical Proposal in response to UNDP Kenya RFP No. UNDP-KEN-2026-0042. Our understanding of the assignment centers on establishing a resilient, scalable, and standards-compliant National Digital Health Interoperability Architecture under the stewardship of the Ministry of Health.

Drawing upon our verified track record of 42 completed advisory contracts across East Africa, our proposed approach emphasizes practical standards adoption (HL7 FHIR Release 4 and OpenHIE guidelines), data sovereignty, and institutional capacity building. Dr. Sarah Chen brings 14 years experience leading health architecture for WHO and UNICEF to head this assignment.`,
        citations: [
          {
            sourceDoc: 'Apex Advisory Group - 2026 Corporate Capability Statement.pdf',
            excerpt: '42 advisory contracts completed with UN Secretariat, World Bank, and USAID since 2018.',
            pageRef: 'Page 3'
          },
          {
            sourceDoc: 'Dr. Sarah Chen - Principal Digital Health Architect CV.pdf',
            excerpt: '14 years designing national health information exchanges and digital health systems...',
            pageRef: 'Summary'
          }
        ]
      },
      {
        id: 'sec-2',
        title: '2. Proposed Technical Approach & Methodology (Criterion 1: 40%)',
        content: `Our technical approach directly mirrors the TOR scope and evaluation framework across five phases:

Phase 1: Inception & Baseline Architecture Assessment (Weeks 1-4)
Inventory of health facility registries, reviewing schemas, API endpoints, and authentication policies against FHIR R4 standards.

Phase 2: Target Interoperability Framework & Core Data Dictionary (Weeks 5-12)
Design of shared Core Data Dictionary, Master Patient Index governance, and RESTful middleware specifications ensuring seamless synchronization with DHIS2 national dashboards.

Phase 3: Prototype Middleware Testing & Security Hardening (Weeks 13-18)
Sandboxed reference implementations, simulated stress testing for high-concurrency facility reporting, and role-based access control compliance.

Phase 4: Transition Roadmap, Costing & Governance Charter (Weeks 19-22)
Formulation of phased migration blueprints, operational risk mitigations, and total cost of ownership models for ministerial adoption.

Phase 5: Institutional Knowledge Transfer & Final Dissemination (Weeks 23-24)
Structured training workshops for Ministry of Health technical teams and comprehensive handover documentation.`,
        citations: [
          {
            sourceDoc: 'UNOPS PFM & Financial Reporting Automation - Final Technical Proposal.docx',
            excerpt: 'Five-phase systems integration framework for sub-national reporting.',
            pageRef: 'Page 14'
          }
        ]
      },
      {
        id: 'sec-3',
        title: '3. Team Composition & Personnel Qualifications (Criterion 2: 35%)',
        content: `The proposed team brings verifiable qualifications directly addressing the TOR:

- Team Lead / Principal Health Architect: Dr. Sarah Chen. 14 years experience in health architecture, OpenHIE, and FHIR standards.
- Cloud Infrastructure & Security Lead: Eng. David Ochieng. 12 years experience in datacenter modernization and ISO 27001 compliance.`,
        citations: [
          {
            sourceDoc: 'Dr. Sarah Chen - Principal Digital Health Architect CV.pdf',
            excerpt: '14 years designing national health information exchanges...',
            pageRef: 'Page 1'
          },
          {
            sourceDoc: 'Eng. David Ochieng - Lead Enterprise Infrastructure Consultant CV.pdf',
            excerpt: '12 years in government datacenter modernization and ISO 27001...',
            pageRef: 'Page 2'
          }
        ]
      },
      {
        id: 'sec-4',
        title: '4. Firm Experience & Past Performance (Criterion 3: 25%)',
        content: `Apex Advisory Group has delivered 42 contracts for UN agencies and development banks. Key comparable references include:

1. UNOPS Regional PFM Integration (2025): Deployed automated financial reporting across 14 agencies on schedule and within budget.
2. WHO AFRO Epidemiological Data Exchange Assessment (2024): Formulated multi-country data exchange protocols and API standardization.`,
        citations: [
          {
            sourceDoc: 'UNOPS PFM & Financial Reporting Automation - Final Technical Proposal.docx',
            excerpt: 'Winning 1.8M USD technical proposal for automated treasury reporting...',
            pageRef: 'Page 1'
          }
        ]
      }
    ]
  }
];

export const initialAuditLogs: AuditLogEntry[] = [
  {
    id: 'log-1',
    timestamp: '2026-11-07 08:30',
    actor: 'system',
    actorName: 'UNGM Crawler',
    event: 'found',
    tenderId: 'tender-1',
    tenderTitle: 'Consultancy for National Digital Health Strategy & Interoperability Architecture',
    source: 'UNGM Feed',
    details: 'Discovered new notice UNDP-KEN-2026-0042 published by UNDP Kenya.'
  },
  {
    id: 'log-2',
    timestamp: '2026-11-07 08:32',
    actor: 'system',
    actorName: 'TOR Parser',
    event: 'extracted',
    tenderId: 'tender-1',
    tenderTitle: 'Consultancy for National Digital Health Strategy & Interoperability Architecture',
    source: 'Automated Extraction',
    details: 'Extracted 3 evaluation criteria, 3 required expertise areas, and 3 deliverables.'
  },
  {
    id: 'log-3',
    timestamp: '2026-11-07 08:35',
    actor: 'system',
    actorName: 'Fit Engine',
    event: 'scored',
    tenderId: 'tender-1',
    tenderTitle: 'Consultancy for National Digital Health Strategy & Interoperability Architecture',
    source: 'Fit Model v1',
    details: 'Assigned Fit Score 94/100. Generated recommendation: bid.'
  },
  {
    id: 'log-4',
    timestamp: '2026-11-07 08:45',
    actor: 'user',
    actorName: 'Romano Juma',
    event: 'decision_made',
    tenderId: 'tender-4',
    tenderTitle: 'Feasibility Study for Solar Mini-Grid Electrification in Off-Grid Counties',
    source: 'Bid Desk',
    details: 'Approved decision: no_bid. Out of firm capability scope.'
  },
  {
    id: 'log-5',
    timestamp: '2026-11-07 09:30',
    actor: 'user',
    actorName: 'Romano Juma',
    event: 'decision_made',
    tenderId: 'tender-1',
    tenderTitle: 'Consultancy for National Digital Health Strategy & Interoperability Architecture',
    source: 'Bid Desk',
    details: 'Approved decision: bid. Moving to proposal drafting.'
  },
  {
    id: 'log-6',
    timestamp: '2026-11-07 10:15',
    actor: 'system',
    actorName: 'Team Matcher',
    event: 'team_matched',
    tenderId: 'tender-1',
    tenderTitle: 'Consultancy for National Digital Health Strategy & Interoperability Architecture',
    source: 'Roster Matcher',
    details: 'Matched Dr. Sarah Chen (96%) and Eng. David Ochieng (92%). 0 capability gaps.'
  },
  {
    id: 'log-7',
    timestamp: '2026-11-07 11:30',
    actor: 'system',
    actorName: 'Proposal Generator',
    event: 'draft_generated',
    tenderId: 'tender-1',
    tenderTitle: 'Consultancy for National Digital Health Strategy & Interoperability Architecture',
    source: 'Criteria Template',
    details: 'Drafted 4 sections pre-filled from TOR evaluation criteria.'
  }
];

import type { Tender, TOR, DecisionRecord, OutcomeFeedback, PipelineStage } from '../data/mockData';

// Signatures match planned REST endpoints:
// GET /api/tenders
// GET /api/tenders/:id
// POST /api/tenders/extract-tor
// PATCH /api/tenders/:id/decision
// PATCH /api/tenders/:id/outcome
// PATCH /api/tenders/:id/submit

export async function fetchTenders(): Promise<Tender[]> {
  // Mock async resolution
  return Promise.resolve([]);
}

export async function extractTORFromFile(file: { name: string; size: number }): Promise<TOR> {
  // Simulates POST /api/tenders/extract-tor
  return Promise.resolve({
    donor: 'UNDP / Global Fund',
    deadline: '2026-12-18',
    budget: '$300,000 - $450,000',
    eligibility: [
      'Registered consulting firm with minimum 3 years audited accounts.',
      'Documented compliance with UN supplier code of conduct.'
    ],
    evaluationCriteria: [
      { name: 'Technical Methodology & Work Plan', weight: 45 },
      { name: 'Key Personnel Technical Competence', weight: 35 },
      { name: 'Past Performance & References', weight: 20 },
    ],
    requiredExpertise: [
      'Digital Health Architecture',
      'Public Sector Systems Governance',
      'Data Security & Encryption'
    ],
    deliverables: [
      { title: 'Inception Report', dueWeek: 3 },
      { title: 'Interoperability Assessment', dueWeek: 8 },
      { title: 'Final Architecture Roadmap', dueWeek: 16 },
    ]
  });
}

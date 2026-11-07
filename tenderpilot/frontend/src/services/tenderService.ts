import type { Tender, TOR } from '../data/mockData';
import type { ApiTender } from './apiTender';
import { normalizeApiTender } from '../utils/tenderLogic';

const isBrowser = typeof window !== 'undefined' && window.location && window.location.origin && window.location.origin.startsWith('http') && !window.location.origin.includes('localhost:3000');

function getFullUrl(path: string): string | null {
  if (isBrowser) {
    return `${window.location.origin}${path}`;
  }
  return null;
}

const API_BASE = '/api/v1';

export async function fetchTenders(): Promise<Tender[]> {
  const url = getFullUrl(`${API_BASE}/tenders`);
  if (!url) return Promise.resolve([]);

  try {
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        // Backend uses its own field names; normalize before pages render the records.
        return (data as ApiTender[]).filter((t) => t && t.id).map(normalizeApiTender);
      }
    }
  } catch (err) {
    console.warn('Backend unavailable, falling back to local state:', err);
  }
  return Promise.resolve([]);
}

export async function extractTORFromFile(file: { name: string; size: number }): Promise<TOR> {
  const url = getFullUrl(`${API_BASE}/tenders/extract-tor`);
  if (url) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: file.name, fileSize: file.size }),
      });
      if (res.ok) {
        const tor = await res.json();
        return tor as TOR;
      }
    } catch (err) {
      console.warn('TOR extraction API unavailable, falling back:', err);
    }
  }

  // Graceful fallback
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

export async function recordDecisionOnApi(
  tenderId: string,
  decision: 'bid' | 'no_bid',
  notes?: string
): Promise<boolean> {
  const url = getFullUrl(`${API_BASE}/tenders/${tenderId}/decision`);
  if (!url) return false;

  try {
    const res = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision, notes }),
    });
    return res.ok;
  } catch (err) {
    console.warn('API decision sync fallback:', err);
    return false;
  }
}

export async function recordOutcomeOnApi(
  tenderId: string,
  outcome: 'won' | 'lost',
  learningNote: string
): Promise<boolean> {
  const url = getFullUrl(`${API_BASE}/tenders/${tenderId}/outcome`);
  if (!url) return false;

  try {
    const res = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ outcome, learningNote }),
    });
    return res.ok;
  } catch (err) {
    console.warn('API outcome sync fallback:', err);
    return false;
  }
}

export async function markSubmittedOnApi(tenderId: string): Promise<boolean> {
  const url = getFullUrl(`${API_BASE}/tenders/${tenderId}/submit`);
  if (!url) return false;

  try {
    const res = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    return res.ok;
  } catch (err) {
    console.warn('API submit sync fallback:', err);
    return false;
  }
}

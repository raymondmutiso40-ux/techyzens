import type { PipelineStage, Tender, TOR } from '../data/mockData';

/**
 * Shape returned by the backend (`enrich_tender_for_frontend` in app/api/v1/tenders.py).
 * Every field is optional so a partial or older payload never crashes the UI.
 */
export interface ApiTender {
  id: string;
  reference_code?: string | null;
  title?: string;
  source_name?: string;
  source_url?: string | null;
  donor?: string | null;
  deadline?: string | null;
  budget?: string | null;
  country?: string | null;
  stage?: string;
  fitScore?: number | null;
  fit_score?: number | null;
  recommendation?: string;
  strengths?: string[];
  risks?: string[];
  summary?: string;
  tor?: Partial<TOR> | null;
  matchedTeam?: { consultantId: string; consultantName: string; matchPercentage: number; expertiseCovered: string[] }[];
  missingExpertise?: string[];
  humanDecision?: { decision: 'bid' | 'no_bid'; decidedBy: string; decidedAt: string; notes?: string } | null;
  outcome?: Tender['outcome'] | null;
  submittedAt?: string | null;
}

const STAGES: PipelineStage[] = [
  'found', 'extracted', 'scored', 'matched', 'drafted', 'checked', 'review_sent', 'bid', 'no_bid', 'submitted_by_human',
];

/** Convert a backend tender into the frontend `Tender` model. */
export function fromApiTender(api: ApiTender): Tender {
  const tor: TOR = {
    donor: api.tor?.donor || api.donor || 'Not specified',
    deadline: api.tor?.deadline || api.deadline || '',
    budget: api.tor?.budget || api.budget || 'Not specified',
    eligibility: api.tor?.eligibility ?? [],
    evaluationCriteria: api.tor?.evaluationCriteria ?? [],
    requiredExpertise: api.tor?.requiredExpertise ?? [],
    deliverables: api.tor?.deliverables ?? [],
  };
  const stage = STAGES.includes(api.stage as PipelineStage) ? (api.stage as PipelineStage) : 'found';
  const fit = api.fitScore ?? api.fit_score ?? 0;

  return {
    id: api.id,
    referenceNumber: api.reference_code || api.id.slice(0, 8).toUpperCase(),
    title: api.title || 'Untitled tender',
    agency: api.donor || tor.donor,
    source: api.source_name || 'TenderPilot API',
    region: api.country || 'Not specified',
    country: api.country || 'Not specified',
    sector: 'Not classified',
    deadline: api.deadline || tor.deadline,
    budgetEst: api.budget || tor.budget,
    fitScore: Math.max(0, Math.min(100, Math.round(fit))),
    recommendation: api.recommendation === 'bid' ? 'bid' : 'no_bid',
    reasons: { strengths: api.strengths ?? [], risks: api.risks ?? [] },
    summary: api.summary || `Imported from ${api.source_name || 'the TenderPilot API'}.`,
    stage,
    tor,
    teamMatching: { assigned: api.matchedTeam ?? [], gaps: api.missingExpertise ?? [] },
    decision: api.humanDecision ?? undefined,
    submittedAt: api.submittedAt ?? undefined,
    outcome: api.outcome ?? undefined,
    sourceUrl: api.source_url ?? undefined,
  };
}

/** Error with a message that is safe to show to the user. */
export class ApiError extends Error {
  status: number;
  constructor(message: string, status = 0) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/** fetch() wrapper that turns network/server failures into readable ApiErrors. */
export async function apiRequest<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, init);
  } catch {
    throw new ApiError("Can't reach the TenderPilot server. Check that the backend is running and try again.");
  }
  let body: unknown = null;
  const text = await res.text();
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = null;
  }
  if (!res.ok) {
    const detail = (body as { detail?: unknown } | null)?.detail;
    const message =
      typeof detail === 'string'
        ? detail
        : res.status >= 500 && body === null
          ? "Can't reach the TenderPilot server. Check that the backend is running and try again."
          : `Request failed (${res.status}).`;
    throw new ApiError(message, res.status);
  }
  return body as T;
}

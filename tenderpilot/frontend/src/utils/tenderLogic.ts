import type { PipelineStage, Tender } from '../data/mockData';

export const STAGE_GROUPS: { label: string; stages: PipelineStage[] }[] = [
  { label: 'Found', stages: ['found', 'extracted'] },
  { label: 'Scored', stages: ['scored'] },
  { label: 'Matched', stages: ['matched'] },
  { label: 'Drafted', stages: ['drafted', 'checked'] },
  { label: 'In review', stages: ['review_sent'] },
  { label: 'Bid', stages: ['bid'] },
  { label: 'Submitted', stages: ['submitted_by_human'] },
  { label: 'No bid', stages: ['no_bid'] },
];

export function normalizeFitScore(value: unknown, fallback = 70): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  const safeFallback = Number.isFinite(fallback) ? fallback : 70;
  return Math.round(Math.min(100, Math.max(0, Number.isFinite(parsed) ? parsed : safeFallback)));
}

export function normalizeApiTender(input: unknown): Tender {
  const raw = (input && typeof input === 'object' ? input : {}) as Record<string, any>;
  const tor = raw.tor && typeof raw.tor === 'object' ? raw.tor : {};
  const reference = raw.referenceNumber || raw.reference_number || raw.reference_code || raw.reference;
  const title = raw.title || raw.tenderTitle || raw.tender_title || raw.name;
  const stage = raw.stage || statusToStage(raw.status);
  const decision = raw.decision || raw.humanDecision || raw.human_decision;
  const rawTeam = raw.teamMatching || {};
  const assignedTeam = Array.isArray(rawTeam.assigned) ? rawTeam.assigned : (Array.isArray(raw.matchedTeam) ? raw.matchedTeam : []);
  const rawDeliverables = Array.isArray(tor.deliverables) ? tor.deliverables : [];
  const strengths = raw.reasons?.strengths || raw.strengths || [];
  const risks = raw.reasons?.risks || raw.risks || [];
  return {
    ...raw,
    id: String(raw.id || `api-tender-${Date.now()}`),
    title: typeof title === 'string' && title.trim() ? title : 'Untitled tender (ref missing)',
    referenceNumber: typeof reference === 'string' && reference.trim() ? reference : 'ref missing',
    agency: raw.agency || raw.donor || tor.donor || raw.source_name || 'Unknown agency',
    source: raw.source || raw.source_name || 'Unknown source',
    sourceUrl: raw.sourceUrl || raw.source_url || undefined,
    deadline: raw.deadline || tor.deadline || '',
    budgetEst: raw.budgetEst || raw.budget || tor.budget || 'Not provided',
    region: raw.region || raw.country || 'Not specified',
    country: raw.country || 'Not specified',
    sector: raw.sector || 'Not specified',
    summary: raw.summary || tor.scope_summary || '',
    reasons: { strengths, risks },
    tor: {
      donor: tor.donor || raw.donor || 'Unknown agency',
      deadline: tor.deadline || raw.deadline || '',
      budget: tor.budget || raw.budget || 'Not provided',
      eligibility: tor.eligibility || tor.eligibility_criteria || [],
      evaluationCriteria: tor.evaluationCriteria || tor.evaluation_criteria || [],
      requiredExpertise: tor.requiredExpertise || tor.key_skills_required || [],
      deliverables: rawDeliverables.map((item: any, index: number) => typeof item === 'string'
        ? { title: item, dueWeek: (index + 1) * 4 }
        : { ...item, title: item.title || `Deliverable ${index + 1}`, dueWeek: item.dueWeek || (index + 1) * 4 }),
    },
    teamMatching: {
      assigned: assignedTeam.map((member: any) => ({
        consultantId: member.consultantId || member.consultant_id || member.id || 'unassigned',
        consultantName: member.consultantName || member.full_name || member.name || 'Unassigned consultant',
        matchPercentage: normalizeFitScore(member.matchPercentage ?? member.match_percentage, 0),
        expertiseCovered: member.expertiseCovered || member.expertise_covered || [],
      })),
      gaps: rawTeam.gaps || raw.missingExpertise || raw.missing_expertise || [],
    },
    fitScore: normalizeFitScore(raw.fitScore ?? raw.fit_score, 0),
    stage: STAGE_GROUPS.some((group) => group.stages.includes(stage)) ? stage : 'found',
    recommendation: String(raw.recommendation || raw.bid_decision || 'no_bid').toLowerCase() === 'bid' ? 'bid' : 'no_bid',
    decision: decision ? {
      decision: decision.decision === 'no_bid' || decision.decision === 'REJECTED' ? 'no_bid' : 'bid',
      decidedBy: decision.decidedBy || decision.decided_by || 'Bid Director',
      decidedAt: decision.decidedAt || decision.decided_at || '',
      notes: decision.notes || decision.comments,
    } : undefined,
  } as Tender;
}

function statusToStage(status: unknown): string {
  const key = String(status || '').toUpperCase();
  const mapping: Record<string, PipelineStage> = {
    DISCOVERED: 'found', EXTRACTED: 'extracted', SCORED: 'scored', MATCHED: 'matched',
    DRAFTED: 'drafted', CHECKED: 'checked', REVIEW_PACK_SENT: 'review_sent',
    UNDER_HUMAN_REVIEW: 'review_sent', APPROVED_TO_BID: 'bid', REJECTED: 'no_bid',
    SUBMITTED_BY_HUMAN: 'submitted_by_human',
  };
  return mapping[key] || String(status || 'found').toLowerCase();
}

export function countPipelineStages(tenders: Pick<Tender, 'stage'>[]) {
  const counts = STAGE_GROUPS.map((group) => ({
    label: group.label,
    value: tenders.filter((tender) => group.stages.includes(tender.stage)).length,
  }));
  const unassigned = tenders.filter((tender) => !STAGE_GROUPS.some((group) => group.stages.includes(tender.stage))).length;
  if (unassigned) counts.push({ label: 'Other', value: unassigned });
  return counts;
}

export function parseTenderDate(value: string | undefined | null): Date | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim());
  if (match) {
    const [, year, month, day] = match;
    const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
    if (date.getUTCFullYear() !== Number(year) || date.getUTCMonth() !== Number(month) - 1 || date.getUTCDate() !== Number(day)) return null;
    return date;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate()));
}

export function buildDeadlineWindow(tenders: Pick<Tender, 'deadline' | 'title'>[], today = new Date(), weeks = 6) {
  const base = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
  base.setUTCDate(base.getUTCDate() - ((base.getUTCDay() + 6) % 7));
  const values = Array.from({ length: weeks }, () => Array(7).fill(0) as number[]);
  const titles: string[][] = Array.from({ length: weeks }, () => Array(7).fill(''));
  tenders.forEach((tender) => {
    const date = parseTenderDate(tender.deadline);
    if (!date) return;
    const index = Math.floor((date.getTime() - base.getTime()) / 86_400_000);
    if (index < 0 || index >= weeks * 7) return;
    const week = Math.floor(index / 7);
    const day = index % 7;
    values[week][day] += 1;
    titles[week][day] = titles[week][day] ? `${titles[week][day]}; ${tender.title}` : tender.title;
  });
  const rows = Array.from({ length: weeks }, (_, week) => {
    const date = new Date(base.getTime() + week * 7 * 86_400_000);
    return `w/c ${date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' })}`;
  });
  return { rows, values, titles };
}

export function applyTenderDecision(tender: Tender, decision: 'bid' | 'no_bid', decidedBy: string, decidedAt: string, notes?: string): Tender {
  return {
    ...tender,
    stage: decision,
    decision: {
      decision,
      decidedBy,
      decidedAt,
      notes: notes || (decision === 'bid' ? 'Proceed with proposal drafting.' : 'Declined opportunity.'),
    },
  };
}

export function applyTenderOutcome(tender: Tender, outcome: 'won' | 'lost', markedAt: string, learningNote: string): Tender {
  return { ...tender, outcome: { outcome, markedAt, learningNote } };
}

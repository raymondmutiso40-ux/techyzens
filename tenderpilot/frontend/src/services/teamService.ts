import type { TeamMatchingResult, KBDocument } from '../data/mockData';

const API_BASE = '/api/v1';

export async function fetchTeamMembersFromApi(): Promise<any[]> {
  try {
    const res = await fetch(`${API_BASE}/team`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Backend team fetch fallback:', err);
  }
  return [];
}

export async function matchTeamForTender(
  requiredExpertise: string[],
  availableConsultants: KBDocument[]
): Promise<TeamMatchingResult> {
  const assigned = availableConsultants
    .filter((c) => c.type === 'CV' && c.consultantName)
    .map((c, idx) => ({
      consultantId: c.id,
      consultantName: c.consultantName || c.name,
      matchPercentage: idx === 0 ? 95 : 88,
      expertiseCovered: c.keySkills.slice(0, 2),
    }));

  const coveredSet = new Set(assigned.flatMap((a) => a.expertiseCovered));
  const gaps = requiredExpertise.filter((req) => !coveredSet.has(req));

  return Promise.resolve({
    assigned,
    gaps,
  });
}

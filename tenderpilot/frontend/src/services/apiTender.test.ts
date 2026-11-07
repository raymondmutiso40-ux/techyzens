import { describe, it, expect, vi, afterEach } from 'vitest';
import { apiRequest, ApiError, fromApiTender } from './apiTender';

afterEach(() => vi.restoreAllMocks());

describe('fromApiTender', () => {
  it('maps backend field names onto the frontend Tender model', () => {
    const t = fromApiTender({
      id: 'abc-123',
      reference_code: 'URL-1A2B',
      title: 'Health Data Portal',
      source_name: 'Web link (undp.org)',
      source_url: 'https://undp.org/notice/1',
      donor: 'UNDP',
      deadline: '2026-12-20',
      budget: 'USD 400,000',
      country: 'Kenya',
      stage: 'scored',
      fitScore: 81,
      recommendation: 'bid',
      strengths: ['Good team'],
      risks: ['Tight deadline'],
      tor: { evaluationCriteria: [{ name: 'Method', weight: 50 }], requiredExpertise: ['Data'] },
      matchedTeam: [{ consultantId: 'c1', consultantName: 'A', matchPercentage: 90, expertiseCovered: ['Data'] }],
    });
    expect(t.referenceNumber).toBe('URL-1A2B');
    expect(t.agency).toBe('UNDP');
    expect(t.budgetEst).toBe('USD 400,000');
    expect(t.stage).toBe('scored');
    expect(t.reasons).toEqual({ strengths: ['Good team'], risks: ['Tight deadline'] });
    expect(t.teamMatching.assigned).toHaveLength(1);
    expect(t.tor.evaluationCriteria[0].name).toBe('Method');
    expect(t.tor.deliverables).toEqual([]);
    expect(t.sourceUrl).toBe('https://undp.org/notice/1');
  });

  it('fills safe defaults for a minimal payload so pages never crash', () => {
    const t = fromApiTender({ id: 'xyz98765-aaaa' });
    expect(t.referenceNumber).toBe('XYZ98765');
    expect(t.title).toBe('Untitled tender');
    expect(t.stage).toBe('found');
    expect(t.fitScore).toBe(0);
    expect(t.recommendation).toBe('no_bid');
    expect(t.reasons.strengths).toEqual([]);
    expect(t.teamMatching).toEqual({ assigned: [], gaps: [] });
    // Fields the Tenders page calls string methods on
    expect(typeof t.agency).toBe('string');
    expect(typeof t.country).toBe('string');
  });

  it('clamps out-of-range scores and ignores unknown stages', () => {
    expect(fromApiTender({ id: '1', fitScore: 140, stage: 'weird' })).toMatchObject({ fitScore: 100, stage: 'found' });
  });
});

describe('apiRequest', () => {
  it('surfaces the backend "detail" message', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ detail: 'File is larger than 15 MB.' }), { status: 413 })
    );
    await expect(apiRequest('/x')).rejects.toMatchObject({ message: 'File is larger than 15 MB.', status: 413 });
  });

  it('explains when the server cannot be reached', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'));
    await expect(apiRequest('/x')).rejects.toBeInstanceOf(ApiError);
    await expect(apiRequest('/x')).rejects.toThrow(/can't reach the TenderPilot server/i);
  });

  it('treats a proxy 500 with no JSON body as server unreachable', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('', { status: 500 }));
    await expect(apiRequest('/x')).rejects.toThrow(/can't reach/i);
  });
});

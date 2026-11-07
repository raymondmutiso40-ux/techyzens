import { describe, expect, it } from 'vitest';
import { initialTenders } from '../data/mockData';
import {
  applyTenderDecision,
  applyTenderOutcome,
  buildDeadlineWindow,
  countPipelineStages,
  normalizeApiTender,
  normalizeFitScore,
  parseTenderDate,
} from './tenderLogic';

describe('tender logic', () => {
  it('normalizes normal, missing and boundary fit scores', () => {
    expect(normalizeFitScore(87.6)).toBe(88);
    expect(normalizeFitScore('42')).toBe(42);
    expect(normalizeFitScore(undefined)).toBe(70);
    expect(normalizeFitScore(undefined, 0)).toBe(0);
    expect(normalizeFitScore(-1)).toBe(0);
    expect(normalizeFitScore(101)).toBe(100);
  });

  it('assigns every tender to one pipeline bucket, including an unknown legacy stage', () => {
    const tenders = [...initialTenders, { ...initialTenders[0], id: 'legacy', stage: 'legacy_stage' as typeof initialTenders[number]['stage'] }];
    const counts = countPipelineStages(tenders);
    expect(counts.reduce((sum, item) => sum + item.value, 0)).toBe(tenders.length);
    expect(counts.find((item) => item.label === 'Other')?.value).toBe(1);
  });

  it('parses and filters the six-week deadline window, including WHO AFRO', () => {
    expect(parseTenderDate('2026-11-20')?.toISOString()).toBe('2026-11-20T00:00:00.000Z');
    expect(parseTenderDate('2026-11-20T23:30:00Z')?.toISOString()).toBe('2026-11-20T00:00:00.000Z');
    expect(parseTenderDate('2026-02-30')).toBeNull();
    expect(parseTenderDate('not a date')).toBeNull();
    const window = buildDeadlineWindow([
      { title: 'WHO AFRO', deadline: '2026-11-20' },
      { title: 'End of window', deadline: '2026-12-13' },
      { title: 'After window', deadline: '2026-12-14' },
      { title: 'Invalid', deadline: 'TBD' },
    ], new Date('2026-11-07T12:00:00Z'));
    expect(window.values.flat().reduce((a, b) => a + b, 0)).toBe(2);
    expect(window.titles.flat().join(' ')).toContain('WHO AFRO');
  });

  it('maps backend reference, source, score and title fields with safe fallbacks', () => {
    const tender = normalizeApiTender({ id: 'api-1', title: 'UNICEF Supply Division', reference_code: 'UNICEF-119', source_name: 'UNGM', fit_score: 88, status: 'SCORED' });
    expect(tender).toMatchObject({ title: 'UNICEF Supply Division', referenceNumber: 'UNICEF-119', source: 'UNGM', fitScore: 88, stage: 'scored' });
    expect(normalizeApiTender({ id: 'api-2' }).title).toBe('Untitled tender (ref missing)');
    expect(normalizeApiTender({ id: 'api-2' }).referenceNumber).toBe('ref missing');
  });

  it('transitions found and scored tenders to approved or declined', () => {
    const approved = applyTenderDecision(initialTenders[0], 'bid', 'Reviewer', '2026-11-07 12:00');
    const declined = applyTenderDecision(initialTenders[1], 'no_bid', 'Reviewer', '2026-11-07 12:00');
    expect(approved.stage).toBe('bid');
    expect(approved.decision?.decision).toBe('bid');
    expect(declined.stage).toBe('no_bid');
    expect(declined.decision?.decision).toBe('no_bid');
  });

  it('records an outcome and learning note without changing the decision stage', () => {
    const approved = applyTenderDecision(initialTenders[0], 'bid', 'Reviewer', '2026-11-07 12:00');
    const updated = applyTenderOutcome(approved, 'won', '2026-12-01 12:00', 'Strong team match');
    expect(updated.stage).toBe('bid');
    expect(updated.outcome).toMatchObject({ outcome: 'won', learningNote: 'Strong team match' });
  });
});

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PageHeader,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Modal,
  Input,
  Select,
  EmptyState
} from '../../components/ui';
import { useApp } from '../../context/AppContext';
import type { Tender } from '../../data/mockData';

export const DashboardPage: React.FC = () => {
  const { tenders, proposals, recordDecision, recordOutcome, createProposalForTender } = useApp();
  const navigate = useNavigate();

  // Outcome modal
  const [outcomeTender, setOutcomeTender] = useState<Tender | null>(null);
  const [outcomeType, setOutcomeType] = useState<'won' | 'lost'>('won');
  const [learningNote, setLearningNote] = useState('');

  // 1. Tenders awaiting decision (stage is 'scored' or 'matched' without decision)
  const awaitingDecision = tenders.filter(
    (t) => !t.decision && (t.stage === 'scored' || t.stage === 'matched' || t.stage === 'found')
  );

  // 2. Drafts awaiting review
  const draftsAwaitingReview = proposals.filter(
    (p) => p.status === 'Draft' || p.status === 'Under Review'
  );

  // 3. Upcoming deadlines
  const upcomingTenders = [...tenders].sort((a, b) =>
    a.deadline.localeCompare(b.deadline)
  );

  // Win/Loss learned note (Part B #10)
  const tendersWithOutcome = tenders.filter((t) => t.outcome);
  const latestOutcome = tendersWithOutcome[0] || {
    title: 'WHO Regional Epidemiological Surveillance (Prior 2025 Submission)',
    outcome: {
      outcome: 'won',
      markedAt: '2026-10-15',
      learningNote: 'Partner highlighted clear FHIR interoperability methodology and specific named consultant CVs as decisive differentiator over incumbent firm.',
    },
  };

  const handleSaveOutcome = (e: React.FormEvent) => {
    e.preventDefault();
    if (!outcomeTender) return;
    recordOutcome(outcomeTender.id, outcomeType, learningNote || 'Decision noted.');
    setOutcomeTender(null);
    setLearningNote('');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        category="Bid Desk"
        title="Operational Overview"
        description="Daily shortlist, pending bid decisions, and draft review queue."
      >
        <span className="text-xs text-slate-500">Firm: Apex Advisory Group</span>
      </PageHeader>

      {/* At most 3 small summary numbers at the top (Part B #9) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white border border-slate-200 rounded-md p-3">
          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
            Awaiting Decision
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {awaitingDecision.length}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Scored notices needing partner go/no-go</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-md p-3">
          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
            Drafts in Review
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {draftsAwaitingReview.length}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Technical proposals awaiting sign-off</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-md p-3">
          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
            Active Submissions
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {tenders.filter((t) => t.stage === 'bid' || t.stage === 'review_sent').length}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Opportunities in pursuit pipeline</p>
        </div>
      </div>

      {/* Win/Loss Feedback: "What we learned" note (Part B #10) */}
      <div className="p-3 bg-white border border-slate-200 rounded-md text-xs space-y-1">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-slate-800">
            Win/Loss Debrief Note · {latestOutcome.title}
          </span>
          <Badge variant={latestOutcome.outcome?.outcome === 'won' ? 'success' : 'neutral'}>
            Outcome: {latestOutcome.outcome?.outcome.toUpperCase()}
          </Badge>
        </div>
        <p className="text-slate-600 leading-relaxed">
          {latestOutcome.outcome?.learningNote}
        </p>
      </div>

      {/* Table 1: Tenders awaiting human bid decision */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">
            Tenders Awaiting Go / No-Go Decision ({awaitingDecision.length})
          </h2>
          <button
            onClick={() => navigate('/tenders')}
            className="text-xs text-blue-600 hover:underline"
          >
            View all tenders →
          </button>
        </div>

        {awaitingDecision.length > 0 ? (
          <Table>
            <Thead>
              <Tr>
                <Th>Tender</Th>
                <Th>Donor</Th>
                <Th>Deadline</Th>
                <Th>Fit score</Th>
                <Th>AI Rec</Th>
                <Th className="text-right">Human decision</Th>
              </Tr>
            </Thead>
            <Tbody>
              {awaitingDecision.map((t) => (
                <Tr key={t.id}>
                  <Td className="font-medium text-slate-900 max-w-sm">
                    <div className="truncate">{t.title}</div>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                      {t.referenceNumber}
                    </div>
                  </Td>
                  <Td className="text-xs text-slate-700">{t.agency}</Td>
                  <Td className="text-xs text-slate-600">{t.deadline}</Td>
                  <Td className="font-semibold text-slate-900">{t.fitScore}/100</Td>
                  <Td>
                    <Badge variant={t.recommendation === 'bid' ? 'success' : 'warning'}>
                      {t.recommendation.toUpperCase()}
                    </Badge>
                  </Td>
                  <Td className="text-right space-x-1.5 whitespace-nowrap">
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => recordDecision(t.id, 'bid', 'Approved on dashboard.')}
                    >
                      Approve bid
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => recordDecision(t.id, 'no_bid', 'Declined on dashboard.')}
                    >
                      Decline
                    </Button>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        ) : (
          <p className="p-3 text-xs text-slate-400 bg-white border border-slate-200 rounded">
            All scored opportunities have human decisions recorded.
          </p>
        )}
      </div>

      {/* Two Column Section: Drafts in Review (Left) | Upcoming Deadlines & Outcomes (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Drafts in Review */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">
              Proposals in Review ({draftsAwaitingReview.length})
            </h2>
            <button
              onClick={() => navigate('/proposals')}
              className="text-xs text-blue-600 hover:underline"
            >
              Open studio →
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-md divide-y divide-slate-100">
            {draftsAwaitingReview.map((p) => (
              <div key={p.id} className="p-3 flex items-center justify-between gap-3 text-xs">
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-slate-900 truncate">{p.tenderTitle}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {p.agency} · {p.sections.length} sections · {p.team.length} assigned experts
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={p.checksAcknowledged ? 'success' : 'warning'}>
                    {p.checksAcknowledged ? 'Checks OK' : 'Flags pending'}
                  </Badge>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => navigate('/proposals')}
                  >
                    Review
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Deadlines & Win/Loss Actions */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Upcoming Submission Deadlines</h2>
          </div>

          <div className="bg-white border border-slate-200 rounded-md divide-y divide-slate-100">
            {upcomingTenders.slice(0, 4).map((t) => (
              <div key={t.id} className="p-3 flex items-center justify-between gap-3 text-xs">
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-slate-900 truncate">{t.title}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Deadline: <strong>{t.deadline}</strong> · Donor: {t.agency}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {t.outcome ? (
                    <Badge variant={t.outcome.outcome === 'won' ? 'success' : 'neutral'}>
                      {t.outcome.outcome.toUpperCase()}
                    </Badge>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setOutcomeTender(t)}
                      className="text-xs text-blue-600 hover:underline px-2 py-1"
                    >
                      Log outcome
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Win/Loss Outcome Modal (Part B #10) */}
      {outcomeTender && (
        <Modal
          isOpen={Boolean(outcomeTender)}
          onClose={() => setOutcomeTender(null)}
          title={`Record Outcome: ${outcomeTender.title}`}
          description="Log winning or losing debrief notes to improve future proposal scoring."
        >
          <form onSubmit={handleSaveOutcome} className="space-y-3 text-xs">
            <Select
              label="Bid outcome"
              value={outcomeType}
              onChange={(e) => setOutcomeType(e.target.value as any)}
              options={[
                { value: 'won', label: 'Won / Awarded Contract' },
                { value: 'lost', label: 'Lost / Not Awarded' },
              ]}
            />

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Debrief notes ("What we learned")
              </label>
              <textarea
                rows={3}
                required
                value={learningNote}
                onChange={(e) => setLearningNote(e.target.value)}
                placeholder="e.g. Donor debrief cited strong staffing matrix but requested lower senior daily billing rates..."
                className="w-full px-3 py-2 border border-slate-300 rounded text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button type="button" variant="secondary" onClick={() => setOutcomeTender(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Save outcome
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

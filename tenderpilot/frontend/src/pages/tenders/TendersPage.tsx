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
  EmptyState,
  Tabs,
  FileDropzone,
  Segmented
} from '../../components/ui';
import { useApp } from '../../context/AppContext';
import type { Tender, PipelineStage } from '../../data/mockData';
import { ACCEPT_ATTR, importTenderFromUrl, uploadTorFile, validateUploadFile } from '../../services/intakeService';

const pipelineSteps: { stage: PipelineStage; label: string }[] = [
  { stage: 'found', label: 'Find' },
  { stage: 'extracted', label: 'Extract' },
  { stage: 'scored', label: 'Score' },
  { stage: 'matched', label: 'Match' },
  { stage: 'drafted', label: 'Draft' },
  { stage: 'checked', label: 'Check' },
  { stage: 'review_sent', label: 'Send' },
];

export const TendersPage: React.FC = () => {
  const {
    tenders,
    documents,
    createProposalForTender,
    addImportedTender,
    recordDecision,
    markSubmittedByHuman,
    swapConsultantOnTender,
    removeConsultantFromTender,
  } = useApp();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSector, setSelectedSector] = useState('ALL');
  const [minFitScore, setMinFitScore] = useState(0);
  const [selectedTender, setSelectedTender] = useState<Tender | null>(null);
  const [detailTab, setDetailTab] = useState<'OVERVIEW' | 'TOR' | 'TEAM'>('OVERVIEW');

  // Add-tender modal: upload a TOR file or give the agent a link
  const [showUploadTORModal, setShowUploadTORModal] = useState(false);
  const [intakeMode, setIntakeMode] = useState<'file' | 'url'>('file');
  const [torFile, setTorFile] = useState<File | null>(null);
  const [tenderUrl, setTenderUrl] = useState('');
  const [intakeError, setIntakeError] = useState<string | null>(null);
  const [isExtractingTOR, setIsExtractingTOR] = useState(false);

  const openIntake = (mode: 'file' | 'url') => {
    setIntakeMode(mode);
    setIntakeError(null);
    setShowUploadTORModal(true);
  };

  const closeIntake = () => {
    if (isExtractingTOR) return;
    setShowUploadTORModal(false);
    setTorFile(null);
    setTenderUrl('');
    setIntakeError(null);
  };

  // Swap consultant state
  const [swappingOldId, setSwappingOldId] = useState<string | null>(null);
  const [swapNewDocId, setSwapNewDocId] = useState<string>('');

  const filteredTenders = tenders.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.agency.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.country.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSector = selectedSector === 'ALL' || t.sector === selectedSector;
    const matchesFit = t.fitScore >= minFitScore;
    return matchesSearch && matchesSector && matchesFit;
  });

  const getStageBadge = (stage: PipelineStage) => {
    const map: Record<PipelineStage, { label: string; variant: 'neutral' | 'success' | 'warning' | 'danger' | 'info' }> = {
      found: { label: 'Found', variant: 'neutral' },
      extracted: { label: 'TOR Extracted', variant: 'info' },
      scored: { label: 'Scored', variant: 'info' },
      matched: { label: 'Team Matched', variant: 'info' },
      drafted: { label: 'Drafted', variant: 'neutral' },
      checked: { label: 'Checked', variant: 'neutral' },
      review_sent: { label: 'Review Sent', variant: 'warning' },
      bid: { label: 'Bid Approved', variant: 'success' },
      no_bid: { label: 'Declined', variant: 'danger' },
      submitted_by_human: { label: 'Submitted', variant: 'success' },
    };
    const s = map[stage] || { label: stage, variant: 'neutral' };
    return <Badge variant={s.variant}>{s.label}</Badge>;
  };

  const handleUploadTOR = async (e: React.FormEvent) => {
    e.preventDefault();
    setIntakeError(null);
    if (intakeMode === 'file') {
      if (!torFile) {
        setIntakeError('Choose a TOR file to upload.');
        return;
      }
      const problem = validateUploadFile(torFile);
      if (problem) {
        setIntakeError(problem);
        return;
      }
    } else if (!tenderUrl.trim()) {
      setIntakeError('Paste the link to a tender notice.');
      return;
    }

    setIsExtractingTOR(true);
    try {
      const created =
        intakeMode === 'file' ? await uploadTorFile(torFile!) : await importTenderFromUrl(tenderUrl);
      addImportedTender(created, intakeMode === 'file' ? torFile!.name : tenderUrl.trim());
      setShowUploadTORModal(false);
      setTorFile(null);
      setTenderUrl('');
      setSelectedTender(created);
      setDetailTab('TOR');
    } catch (err) {
      setIntakeError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsExtractingTOR(false);
    }
  };

  const handleApproveBid = (tenderId: string) => {
    recordDecision(tenderId, 'bid', 'Approved by bid desk. Proceed with proposal drafting.');
    if (selectedTender?.id === tenderId) {
      setSelectedTender((prev) =>
        prev
          ? {
              ...prev,
              stage: 'bid',
              decision: {
                decision: 'bid',
                decidedBy: 'Romano Juma',
                decidedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
                notes: 'Approved by bid desk. Proceed with proposal drafting.',
              },
            }
          : null
      );
    }
  };

  const handleDeclineBid = (tenderId: string) => {
    recordDecision(tenderId, 'no_bid', 'Declined. Strategic or capability mismatch.');
    if (selectedTender?.id === tenderId) {
      setSelectedTender((prev) =>
        prev
          ? {
              ...prev,
              stage: 'no_bid',
              decision: {
                decision: 'no_bid',
                decidedBy: 'Romano Juma',
                decidedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
                notes: 'Declined. Strategic or capability mismatch.',
              },
            }
          : null
      );
    }
  };

  const handleExecuteSwap = (tenderId: string) => {
    if (!swappingOldId || !swapNewDocId) return;
    swapConsultantOnTender(tenderId, swappingOldId, swapNewDocId);
    setSwappingOldId(null);
    setSwapNewDocId('');
    // Refresh local selectedTender state
    const tender = tenders.find((t) => t.id === tenderId);
    if (tender) setSelectedTender(tender);
  };

  const getStepStatus = (currentStage: PipelineStage, stepIndex: number) => {
    const order: PipelineStage[] = [
      'found',
      'extracted',
      'scored',
      'matched',
      'drafted',
      'checked',
      'review_sent',
    ];
    const currentIndex = order.indexOf(currentStage);
    if (currentIndex === -1) {
      if (currentStage === 'bid' || currentStage === 'submitted_by_human') return 'complete';
      return 'pending';
    }
    if (stepIndex < currentIndex) return 'complete';
    if (stepIndex === currentIndex) return 'current';
    return 'pending';
  };

  return (
    <div className="space-y-4">
      <PageHeader
        category="Bid Pipeline"
        title="Tender Pipeline"
        description="Structured TOR extraction, fit scoring, team matching, and bid decisions."
      >
        <div className="flex items-center gap-2">
          <Button size="sm" variant="secondary" onClick={() => openIntake('url')}>
            Add from link
          </Button>
          <Button size="sm" variant="primary" onClick={() => openIntake('file')}>
            Upload TOR
          </Button>
        </div>
      </PageHeader>

      {/* Filter toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 border border-slate-200 rounded-md">
        <div className="flex items-center gap-2 flex-1">
          <input
            type="text"
            placeholder="Search by title, agency, or reference..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-8 px-2.5 text-xs bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-600 w-full sm:w-72"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={selectedSector}
            onChange={(e) => setSelectedSector(e.target.value)}
            className="h-8 px-2 text-xs bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-600 text-slate-700"
          >
            <option value="ALL">All sectors</option>
            <option value="Digital Transformation & IT">Digital Transformation & IT</option>
            <option value="Public Financial Management">Public Financial Management</option>
            <option value="Healthcare & Life Sciences">Healthcare & Life Sciences</option>
            <option value="Energy & Infrastructure">Energy & Infrastructure</option>
          </select>

          <button
            type="button"
            onClick={() => setMinFitScore(minFitScore === 70 ? 0 : 70)}
            className={`h-8 px-2.5 rounded text-xs border transition-colors duration-100 ${
              minFitScore > 0
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            {minFitScore > 0 ? 'Min fit ≥ 70' : 'All scores'}
          </button>
        </div>
      </div>

      {/* Table view */}
      {filteredTenders.length > 0 ? (
        <Table>
          <Thead>
            <Tr>
              <Th>Ref</Th>
              <Th>Title</Th>
              <Th>Donor / Agency</Th>
              <Th>Deadline</Th>
              <Th>Fit score</Th>
              <Th>Stage</Th>
              <Th className="text-right">Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {filteredTenders.map((tender) => (
              <Tr key={tender.id}>
                <Td className="font-mono text-[11px] text-slate-500 whitespace-nowrap">
                  {tender.referenceNumber}
                </Td>
                <Td className="font-medium text-slate-900 max-w-sm">
                  <div className="line-clamp-2">{tender.title}</div>
                  <div className="text-[11px] text-slate-500 font-normal mt-0.5">
                    {tender.country} · {tender.budgetEst}
                  </div>
                </Td>
                <Td className="text-xs text-slate-700 whitespace-nowrap">{tender.agency}</Td>
                <Td className="text-xs text-slate-600 whitespace-nowrap">{tender.deadline}</Td>
                <Td className="whitespace-nowrap">
                  <span className="font-semibold text-slate-900">{tender.fitScore}</span>
                  <span className="text-[11px] text-slate-500">/100</span>
                </Td>
                <Td className="whitespace-nowrap">{getStageBadge(tender.stage)}</Td>
                <Td className="text-right whitespace-nowrap space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTender(tender);
                      setDetailTab('OVERVIEW');
                    }}
                    className="text-xs text-slate-700 hover:underline"
                  >
                    View
                  </button>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => {
                      createProposalForTender(tender.id);
                      navigate('/proposals');
                    }}
                  >
                    Draft proposal
                  </Button>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      ) : (
        <EmptyState
          title="No tenders match filters"
          description="Try broadening your sector selection or reducing the minimum fit score."
          action={
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setSearchTerm('');
                setSelectedSector('ALL');
                setMinFitScore(0);
              }}
            >
              Reset filters
            </Button>
          }
        />
      )}

      {/* Tender Detail Modal */}
      {selectedTender && (
        <Modal
          isOpen={Boolean(selectedTender)}
          onClose={() => setSelectedTender(null)}
          title={selectedTender.title}
          description={`${selectedTender.referenceNumber} · ${selectedTender.agency} · ${selectedTender.country}`}
          maxWidth="2xl"
        >
          <div className="space-y-4 text-xs">
            {selectedTender.sourceUrl && (
              <a
                href={selectedTender.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-accent-600 hover:underline break-all"
              >
                Open original notice ↗
              </a>
            )}
            {/* 7-Step Pipeline Progress Indicator (Part B #1) */}
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
              <div className="text-[10px] font-semibold uppercase text-slate-400 mb-1.5">
                Pipeline stage
              </div>
              <div className="flex items-center justify-between flex-wrap gap-2 text-[11px]">
                {pipelineSteps.map((step, idx) => {
                  const status = getStepStatus(selectedTender.stage, idx);
                  return (
                    <div key={step.stage} className="flex items-center gap-1.5">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          status === 'complete'
                            ? 'bg-slate-900'
                            : status === 'current'
                            ? 'bg-blue-600 ring-2 ring-blue-100'
                            : 'bg-slate-300'
                        }`}
                      />
                      <span
                        className={
                          status === 'current'
                            ? 'font-semibold text-slate-900'
                            : status === 'complete'
                            ? 'text-slate-800'
                            : 'text-slate-400'
                        }
                      >
                        {step.label}
                      </span>
                      {idx < pipelineSteps.length - 1 && (
                        <span className="text-slate-300 ml-1">·</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tabs: Overview | Extracted TOR | Team */}
            <Tabs
              activeTab={detailTab}
              onChange={(t) => setDetailTab(t as any)}
              tabs={[
                { id: 'OVERVIEW', label: 'Evaluation & Decision' },
                { id: 'TOR', label: 'Extracted TOR' },
                {
                  id: 'TEAM',
                  label: 'Team Matching',
                  count: selectedTender.teamMatching.assigned.length,
                },
              ]}
            />

            {detailTab === 'OVERVIEW' && (
              <div className="space-y-3">
                {/* Score & Recommendation Banner */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900">
                        Fit Score: {selectedTender.fitScore}/100
                      </span>
                      <span className="text-slate-300">|</span>
                      <span className="text-xs text-slate-700">
                        AI Recommendation: <strong>{selectedTender.recommendation.toUpperCase()}</strong>
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      The AI only recommends. A human makes the go/no-go bid decision.
                    </p>
                  </div>
                  <div>{getStageBadge(selectedTender.stage)}</div>
                </div>

                {/* Strengths & Risks (Part B #3) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3 bg-white border border-slate-200 rounded space-y-1.5">
                    <span className="font-semibold text-slate-900 text-xs block">Strengths</span>
                    <ul className="list-disc pl-4 text-slate-600 space-y-1">
                      {selectedTender.reasons.strengths.map((str, i) => (
                        <li key={i}>{str}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3 bg-white border border-slate-200 rounded space-y-1.5">
                    <span className="font-semibold text-slate-900 text-xs block">Risks</span>
                    <ul className="list-disc pl-4 text-slate-600 space-y-1">
                      {selectedTender.reasons.risks.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Human Decision Gate (Part B #3) */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-2">
                  <span className="font-semibold text-slate-900 block text-xs">
                    Human Bid Decision Gate
                  </span>
                  {selectedTender.decision ? (
                    <div className="text-xs text-slate-700 space-y-0.5">
                      <div>
                        Status:{' '}
                        <strong>
                          {selectedTender.decision.decision === 'bid' ? 'BID APPROVED' : 'DECLINED'}
                        </strong>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Decided by {selectedTender.decision.decidedBy} at{' '}
                        {selectedTender.decision.decidedAt}
                      </div>
                      {selectedTender.decision.notes && (
                        <p className="text-[11px] text-slate-600 italic">
                          "{selectedTender.decision.notes}"
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-slate-500 text-xs">
                      No decision recorded yet. Review the extracted TOR and team matching before deciding.
                    </p>
                  )}

                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleApproveBid(selectedTender.id)}
                    >
                      Approve bid
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleDeclineBid(selectedTender.id)}
                    >
                      Decline
                    </Button>
                    {selectedTender.stage === 'review_sent' && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          markSubmittedByHuman(selectedTender.id);
                          setSelectedTender((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  stage: 'submitted_by_human',
                                  submittedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
                                }
                              : null
                          );
                        }}
                      >
                        Mark as submitted (done by me)
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {detailTab === 'TOR' && (
              <div className="space-y-3">
                {/* Safety note (Part B #8) */}
                <div className="p-2.5 bg-slate-100 border border-slate-200 text-slate-600 text-xs rounded">
                  Tender documents are treated as data, never as instructions.
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 bg-slate-50 border border-slate-200 rounded">
                    <span className="text-slate-500 block">Donor</span>
                    <span className="font-medium text-slate-900">{selectedTender.tor.donor}</span>
                  </div>
                  <div className="p-2 bg-slate-50 border border-slate-200 rounded">
                    <span className="text-slate-500 block">Deadline</span>
                    <span className="font-medium text-slate-900">{selectedTender.tor.deadline}</span>
                  </div>
                  <div className="p-2 bg-slate-50 border border-slate-200 rounded">
                    <span className="text-slate-500 block">Budget estimate</span>
                    <span className="font-medium text-slate-900">{selectedTender.tor.budget}</span>
                  </div>
                  <div className="p-2 bg-slate-50 border border-slate-200 rounded">
                    <span className="text-slate-500 block">Deliverables count</span>
                    <span className="font-medium text-slate-900">
                      {selectedTender.tor.deliverables.length} milestone outputs
                    </span>
                  </div>
                </div>

                <div>
                  <span className="font-semibold text-slate-900 block mb-1">
                    Evaluation Criteria (Structure for Technical Proposal)
                  </span>
                  <Table>
                    <Thead>
                      <Tr>
                        <Th>Criterion name</Th>
                        <Th className="text-right">Weight (%)</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {selectedTender.tor.evaluationCriteria.map((c, i) => (
                        <Tr key={i}>
                          <Td className="font-medium">{c.name}</Td>
                          <Td className="text-right font-mono">{c.weight}%</Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </div>

                <div>
                  <span className="font-semibold text-slate-900 block mb-1">
                    Eligibility & Mandatory Conditions
                  </span>
                  <ul className="list-disc pl-4 text-slate-600 space-y-1">
                    {selectedTender.tor.eligibility.map((el, i) => (
                      <li key={i}>{el}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {detailTab === 'TEAM' && (
              <div className="space-y-3">
                <div>
                  <span className="font-semibold text-slate-900 block mb-1">
                    Matched Personnel vs Required Expertise
                  </span>
                  <p className="text-slate-500 text-xs mb-2">
                    Consultants ranked from Knowledge Base matching TOR criteria.
                  </p>

                  <Table>
                    <Thead>
                      <Tr>
                        <Th>Consultant</Th>
                        <Th>Match %</Th>
                        <Th>Expertise covered</Th>
                        <Th className="text-right">Actions</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {selectedTender.teamMatching.assigned.map((a) => (
                        <Tr key={a.consultantId}>
                          <Td className="font-medium text-slate-900">{a.consultantName}</Td>
                          <Td className="font-mono">{a.matchPercentage}%</Td>
                          <Td>
                            <div className="flex flex-wrap gap-1">
                              {a.expertiseCovered.map((exp, i) => (
                                <Badge key={i} variant="neutral">
                                  {exp}
                                </Badge>
                              ))}
                            </div>
                          </Td>
                          <Td className="text-right space-x-2">
                            <button
                              type="button"
                              onClick={() => setSwappingOldId(a.consultantId)}
                              className="text-xs text-blue-600 hover:underline"
                            >
                              Swap
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                removeConsultantFromTender(selectedTender.id, a.consultantId)
                              }
                              className="text-xs text-slate-400 hover:text-red-600"
                            >
                              Remove
                            </button>
                          </Td>
                        </Tr>
                      ))}

                      {/* Explicit Gaps Row (Part B #4) */}
                      {selectedTender.teamMatching.gaps.length > 0 && (
                        <Tr className="bg-amber-50/50">
                          <Td className="font-semibold text-amber-900">
                            Uncovered Capability Gaps
                          </Td>
                          <Td className="font-mono text-amber-700">0%</Td>
                          <Td colSpan={2}>
                            <div className="flex flex-wrap gap-1">
                              {selectedTender.teamMatching.gaps.map((gap, i) => (
                                <span
                                  key={i}
                                  className="text-[11px] px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-medium border border-amber-200"
                                >
                                  Missing: {gap}
                                </span>
                              ))}
                            </div>
                          </Td>
                        </Tr>
                      )}
                    </Tbody>
                  </Table>
                </div>

                {/* Consultant swap selector */}
                {swappingOldId && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-2">
                    <span className="font-semibold text-slate-800 text-xs block">
                      Select replacement consultant from Knowledge Base
                    </span>
                    <div className="flex gap-2">
                      <select
                        value={swapNewDocId}
                        onChange={(e) => setSwapNewDocId(e.target.value)}
                        className="flex-1 h-8 px-2 text-xs bg-white border border-slate-300 rounded text-slate-800"
                      >
                        <option value="">Choose consultant...</option>
                        {documents
                          .filter((d) => d.type === 'CV' && d.id !== swappingOldId)
                          .map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.consultantName || d.name} ({d.keySkills[0] || 'Consultant'})
                            </option>
                          ))}
                      </select>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleExecuteSwap(selectedTender.id)}
                      >
                        Confirm swap
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setSwappingOldId(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Bottom Actions */}
            <div className="flex justify-between items-center pt-3 border-t border-slate-100">
              <Button size="sm" variant="secondary" onClick={() => setSelectedTender(null)}>
                Close
              </Button>
              <Button
                size="sm"
                variant="primary"
                onClick={() => {
                  createProposalForTender(selectedTender.id);
                  navigate('/proposals');
                }}
              >
                Go to proposal studio
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add tender: upload a TOR file, or give the agent a link to read */}
      <Modal
        isOpen={showUploadTORModal}
        onClose={closeIntake}
        title="Add a tender"
        description="Upload the Terms of Reference, or paste a link to the tender notice. TenderPilot reads it, extracts the TOR and scores the fit."
      >
        <form onSubmit={handleUploadTOR} className="space-y-4 text-xs" noValidate>
          <Segmented
            ariaLabel="How to add the tender"
            value={intakeMode}
            onChange={(m) => {
              setIntakeMode(m);
              setIntakeError(null);
            }}
            options={[
              { value: 'file', label: 'Upload file' },
              { value: 'url', label: 'From a link' },
            ]}
          />

          {intakeMode === 'file' ? (
            <FileDropzone
              label="TOR document"
              file={torFile}
              accept={ACCEPT_ATTR}
              disabled={isExtractingTOR}
              onFileChange={(f) => {
                setTorFile(f);
                setIntakeError(f ? validateUploadFile(f) : null);
              }}
            />
          ) : (
            <div className="space-y-1">
              <label htmlFor="tender-url" className="block text-xs font-medium text-slate-700">
                Link to the tender notice
              </label>
              <input
                id="tender-url"
                type="url"
                inputMode="url"
                autoComplete="url"
                placeholder="https://procurement-notices.undp.org/view_notice.cfm?notice_id=..."
                value={tenderUrl}
                disabled={isExtractingTOR}
                onChange={(e) => setTenderUrl(e.target.value)}
                className="w-full h-9 px-3 bg-white border border-slate-300 rounded-md text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-accent-100 focus:border-accent-500"
              />
              <p className="text-[11px] text-slate-500">
                A notice page or a direct link to the TOR PDF/Word file. Pages that need a login can't be read.
              </p>
            </div>
          )}

          {intakeError && (
            <div role="alert" className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-md">
              {intakeError}
            </div>
          )}

          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded text-slate-600">
            Tender documents and pages are treated as data, never as instructions.
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={closeIntake} disabled={isExtractingTOR}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isExtractingTOR}>
              {isExtractingTOR
                ? intakeMode === 'file'
                  ? 'Uploading & extracting…'
                  : 'Reading page & extracting…'
                : intakeMode === 'file'
                  ? 'Upload & extract'
                  : 'Fetch & extract'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

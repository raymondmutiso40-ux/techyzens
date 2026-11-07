import React, { useState } from 'react';
import {
  PageHeader,
  Button,
  Modal,
  Badge,
  Select,
  EmptyState,
  StatusDot
} from '../../components/ui';
import { useApp } from '../../context/AppContext';
import type { ProposalSection } from '../../data/mockData';

export const ProposalsPage: React.FC = () => {
  const {
    proposals,
    tenders,
    activeProposal,
    setActiveProposal,
    updateProposalContent,
    createProposalForTender,
    acknowledgeProposalChecks,
    sendReviewPackForTender,
  } = useApp();

  const currentProposal = activeProposal || proposals[0];
  const [selectedSection, setSelectedSection] = useState<ProposalSection>(
    currentProposal?.sections[0]
  );
  const [editingContent, setEditingContent] = useState<string>(
    currentProposal?.sections[0]?.content || ''
  );
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // New Generation modal (Part B #5)
  const [showGenModal, setShowGenModal] = useState(false);
  const [selectedTenderId, setSelectedTenderId] = useState(tenders[0]?.id || '');
  const [templateType, setTemplateType] = useState<'technical' | 'eoi'>('technical');
  const [isGenerating, setIsGenerating] = useState(false);

  // Review Pack Modal (Part B #7)
  const [showReviewPackModal, setShowReviewPackModal] = useState(false);
  const [reviewEmailRecipients, setReviewEmailRecipients] = useState('review-desk@apexadvisors.com, director@apexadvisors.com');
  const [isSendingReview, setIsSendingReview] = useState(false);

  // Right sidebar tab
  const [sideTab, setSideTab] = useState<'GROUNDING' | 'CHECKS'>('CHECKS');

  const tender = tenders.find((t) => t.id === currentProposal?.tenderId);

  // Checks calculations (Part B #6)
  const unsupportedClaims = currentProposal?.claims.filter((c) => !c.isSupported) || [];
  const complianceGaps =
    currentProposal?.compliance.filter((c) => c.status === 'unmet' || c.status === 'needs_review') ||
    [];
  const hasFlags = unsupportedClaims.length > 0 || complianceGaps.length > 0;
  const isBlocked = hasFlags && !currentProposal?.checksAcknowledged;

  const handleSelectSection = (sec: ProposalSection) => {
    setSelectedSection(sec);
    setEditingContent(sec.content);
    setIsEditing(false);
  };

  const handleSaveSection = () => {
    if (!currentProposal || !selectedSection) return;
    updateProposalContent(currentProposal.id, selectedSection.id, editingContent);
    setSelectedSection((prev) => ({ ...prev, content: editingContent }));
    setIsEditing(false);
    showNotice('Section saved.');
  };

  const showNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3000);
  };

  const handleCopyProposal = () => {
    if (!currentProposal) return;
    const fullText = currentProposal.sections
      .map((s) => `${s.title}\n\n${s.content}`)
      .join('\n\n---\n\n');
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportDocx = () => {
    if (!currentProposal) return;
    const fullText = currentProposal.sections
      .map((s) => `${s.title}\n\n${s.content}`)
      .join('\n\n---\n\n');
    const blob = new Blob([fullText], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TenderPilot-Proposal-${currentProposal.id}.docx`;
    a.click();
    URL.revokeObjectURL(url);
    showNotice('Exported .docx file.');
  };

  const handleStartGeneration = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const newProp = createProposalForTender(selectedTenderId, templateType);
      setActiveProposal(newProp);
      setSelectedSection(newProp.sections[0]);
      setEditingContent(newProp.sections[0]?.content || '');
      setIsGenerating(false);
      setShowGenModal(false);
      showNotice('Draft generated from evaluation criteria.');
    }, 700);
  };

  const handleAcknowledgeChecks = () => {
    if (!currentProposal) return;
    acknowledgeProposalChecks(currentProposal.id);
    showNotice('Checks acknowledged. Ready for review pack.');
  };

  const handleSendReviewPack = () => {
    if (!currentProposal) return;
    setIsSendingReview(true);
    setTimeout(() => {
      sendReviewPackForTender(
        currentProposal.tenderId,
        reviewEmailRecipients.split(',').map((r) => r.trim())
      );
      setIsSendingReview(false);
      setShowReviewPackModal(false);
      showNotice('Review pack dispatched to team.');
    }, 600);
  };

  if (!currentProposal) {
    return (
      <EmptyState
        title="No proposals drafted yet"
        description="Select a scored tender from the pipeline to generate a technical proposal."
        action={
          <Button variant="primary" onClick={() => setShowGenModal(true)}>
            New proposal draft
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        category="Proposal Studio"
        title={currentProposal.tenderTitle}
        description={`${currentProposal.agency} · ${currentProposal.version} · Created ${currentProposal.createdAt}`}
      >
        <div className="flex items-center gap-2 flex-wrap">
          <Button size="sm" variant="secondary" onClick={() => setShowGenModal(true)}>
            New draft
          </Button>
          <Button size="sm" variant="secondary" onClick={handleCopyProposal}>
            {copied ? 'Copied' : 'Copy text'}
          </Button>
          <Button size="sm" variant="secondary" onClick={() => window.print()}>
            Print / PDF
          </Button>
          <Button size="sm" variant="secondary" onClick={handleExportDocx}>
            Export .docx
          </Button>
          <Button
            size="sm"
            variant="primary"
            disabled={isBlocked}
            title={isBlocked ? 'Acknowledge check flags before sending review pack' : ''}
            onClick={() => setShowReviewPackModal(true)}
          >
            Send review pack
          </Button>
        </div>
      </PageHeader>

      {/* Summary line of checks (Part B #6) */}
      <div className="p-2.5 bg-white border border-slate-200 rounded text-xs flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-slate-800">Check summary:</span>
          <span>
            {unsupportedClaims.length === 0 ? (
              <span className="text-emerald-700 font-medium">All claims supported</span>
            ) : (
              <span className="text-amber-700 font-medium">
                {unsupportedClaims.length} unsupported claim{unsupportedClaims.length > 1 ? 's' : ''}
              </span>
            )}
          </span>
          <span className="text-slate-300">·</span>
          <span>
            {complianceGaps.length === 0 ? (
              <span className="text-emerald-700 font-medium">0 compliance gaps</span>
            ) : (
              <span className="text-amber-700 font-medium">
                {complianceGaps.length} compliance item{complianceGaps.length > 1 ? 's' : ''} needing review
              </span>
            )}
          </span>
        </div>

        <div>
          {currentProposal.checksAcknowledged ? (
            <Badge variant="success">Checks acknowledged</Badge>
          ) : isBlocked ? (
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-amber-700">Acknowledge flags to unblock review pack</span>
              <Button size="sm" variant="secondary" onClick={handleAcknowledgeChecks}>
                Acknowledge flags
              </Button>
            </div>
          ) : (
            <Badge variant="neutral">Ready for review</Badge>
          )}
        </div>
      </div>

      {notice && (
        <div className="p-2.5 bg-slate-100 border border-slate-300 text-slate-800 rounded text-xs">
          {notice}
        </div>
      )}

      {/* 3-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Sections list (3 cols) */}
        <div className="lg:col-span-3 bg-white border border-slate-200 rounded-md p-3 space-y-3">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
              Criteria Sections ({currentProposal.sections.length})
            </span>
            <div className="space-y-1">
              {currentProposal.sections.map((sec) => {
                const isSelected = selectedSection?.id === sec.id;
                return (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => handleSelectSection(sec)}
                    className={`w-full text-left px-2.5 py-2 rounded text-xs transition-colors flex items-center justify-between ${
                      isSelected
                        ? 'bg-slate-100 text-slate-900 font-semibold'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <span className="truncate">{sec.title}</span>
                    <span className="text-[10px] text-slate-400 shrink-0 ml-1">
                      {sec.citations.length} ref{sec.citations.length !== 1 ? 's' : ''}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Assigned team
            </span>
            <div className="space-y-1 text-xs text-slate-600">
              {currentProposal.team.map((member, i) => (
                <div key={i} className="truncate">
                  {member}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center editor (6 cols) */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-md p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">{selectedSection.title}</h2>
              <p className="text-[11px] text-slate-500">
                Mirrors TOR evaluation weight. Grounded in verified documents.
              </p>
            </div>
            {isEditing ? (
              <Button size="sm" variant="primary" onClick={handleSaveSection}>
                Save
              </Button>
            ) : (
              <Button size="sm" variant="secondary" onClick={() => setIsEditing(true)}>
                Edit
              </Button>
            )}
          </div>

          {isEditing ? (
            <textarea
              rows={18}
              value={editingContent}
              onChange={(e) => setEditingContent(e.target.value)}
              className="w-full p-3 border border-slate-300 rounded text-xs leading-relaxed text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600 font-mono"
            />
          ) : (
            <div className="text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-line p-2">
              {selectedSection.content}
            </div>
          )}
        </div>

        {/* Right column: Grounding & Checks (3 cols) (Part B #6) */}
        <div className="lg:col-span-3 bg-white border border-slate-200 rounded-md p-3 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSideTab('CHECKS')}
                className={`text-xs font-semibold pb-1 border-b-2 -mb-2.5 transition-colors ${
                  sideTab === 'CHECKS'
                    ? 'border-slate-900 text-slate-900'
                    : 'border-transparent text-slate-400 hover:text-slate-700'
                }`}
              >
                Checks
              </button>
              <button
                type="button"
                onClick={() => setSideTab('GROUNDING')}
                className={`text-xs font-semibold pb-1 border-b-2 -mb-2.5 transition-colors ${
                  sideTab === 'GROUNDING'
                    ? 'border-slate-900 text-slate-900'
                    : 'border-transparent text-slate-400 hover:text-slate-700'
                }`}
              >
                Citations ({selectedSection.citations.length})
              </button>
            </div>
          </div>

          {sideTab === 'CHECKS' ? (
            <div className="space-y-3 text-xs">
              {/* Claims Grounding Check */}
              <div className="space-y-1.5">
                <span className="font-semibold text-slate-800 block text-[11px] uppercase">
                  Claim Grounding
                </span>
                <div className="space-y-1.5">
                  {currentProposal.claims.map((claim) => (
                    <div
                      key={claim.id}
                      className={`p-2 border rounded ${
                        claim.isSupported
                          ? 'bg-slate-50 border-slate-200 text-slate-700'
                          : 'bg-amber-50 border-amber-200 text-amber-900 font-medium'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] mb-0.5">
                        <span className="font-mono text-slate-400">{claim.id}</span>
                        {claim.isSupported ? (
                          <StatusDot status="green" label="Supported" />
                        ) : (
                          <StatusDot status="amber" label="Unsupported claim" />
                        )}
                      </div>
                      <p className="text-[11px] leading-snug">{claim.claimText}</p>
                      {claim.sourceDoc && (
                        <span className="text-[10px] text-slate-500 block mt-1">
                          Source: {claim.sourceDoc} ({claim.pageRef})
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Compliance Checklist */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <span className="font-semibold text-slate-800 block text-[11px] uppercase">
                  TOR Mandatory Checklist
                </span>
                <div className="space-y-1.5">
                  {currentProposal.compliance.map((item) => (
                    <div key={item.id} className="p-2 bg-slate-50 border border-slate-200 rounded">
                      <div className="flex items-center justify-between text-[10px] mb-0.5">
                        <span className="font-mono text-slate-400">{item.id}</span>
                        <Badge
                          variant={
                            item.status === 'met'
                              ? 'success'
                              : item.status === 'unmet'
                              ? 'danger'
                              : 'warning'
                          }
                        >
                          {item.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-slate-800">{item.requirement}</p>
                      {item.notes && (
                        <p className="text-[10px] text-slate-500 mt-0.5">{item.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2 text-xs">
              <span className="font-semibold text-slate-800 block text-[11px] uppercase">
                Section Evidence Citations
              </span>
              {selectedSection.citations.length > 0 ? (
                selectedSection.citations.map((cite, i) => (
                  <div key={i} className="p-2.5 bg-slate-50 border border-slate-200 rounded space-y-1">
                    <div className="font-medium text-slate-900 text-[11px]">{cite.sourceDoc}</div>
                    {cite.pageRef && (
                      <div className="text-[10px] text-slate-500">{cite.pageRef}</div>
                    )}
                    <p className="text-[11px] text-slate-600 italic">"{cite.excerpt}"</p>
                  </div>
                ))
              ) : (
                <p className="text-slate-400 p-2 text-center bg-slate-50 rounded text-xs">
                  General procedural text without citations.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Proposal Generation Modal (Part B #5) */}
      <Modal
        isOpen={showGenModal}
        onClose={() => setShowGenModal(false)}
        title="Generate Proposal Draft"
        description="Select a tender to generate sections directly pre-filled from evaluation criteria."
      >
        <div className="space-y-3 text-xs">
          <Select
            label="Target tender"
            value={selectedTenderId}
            onChange={(e) => setSelectedTenderId(e.target.value)}
            options={tenders.map((t) => ({
              value: t.id,
              label: `[${t.agency}] ${t.title} (${t.fitScore}%)`,
            }))}
          />

          <Select
            label="Structure template"
            value={templateType}
            onChange={(e) => setTemplateType(e.target.value as any)}
            options={[
              { value: 'technical', label: 'Technical Proposal (Criterion-aligned)' },
              { value: 'eoi', label: 'Expression of Interest (EOI)' },
            ]}
          />

          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded text-slate-600">
            Sections will be structured directly from the tender's TOR evaluation criteria so the technical proposal mirrors the scoring rubric.
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button variant="secondary" onClick={() => setShowGenModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" disabled={isGenerating} onClick={handleStartGeneration}>
              {isGenerating ? 'Synthesizing...' : 'Generate draft'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Review Pack Modal (Part B #7) */}
      <Modal
        isOpen={showReviewPackModal}
        onClose={() => setShowReviewPackModal(false)}
        title="Send Proposal Review Pack"
        description="Email package showing score, recommendation, team, draft, and compliance flags."
        maxWidth="xl"
      >
        <div className="space-y-3 text-xs">
          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Recipients (comma-separated emails)
            </label>
            <input
              type="text"
              value={reviewEmailRecipients}
              onChange={(e) => setReviewEmailRecipients(e.target.value)}
              className="w-full h-8 px-2.5 border border-slate-300 rounded text-xs text-slate-900 bg-white"
            />
          </div>

          {/* Exact Email Preview */}
          <div className="border border-slate-200 rounded p-3 bg-slate-50 space-y-2">
            <div className="text-[11px] text-slate-500 border-b border-slate-200 pb-1.5 space-y-0.5">
              <div>
                <strong>Subject:</strong> [TenderPilot Review Pack] {tender?.referenceNumber}: Bid
                Recommendation & Draft Review
              </div>
              <div>
                <strong>From:</strong> bid-desk@apexadvisors.com
              </div>
            </div>

            <div className="text-slate-700 space-y-2 leading-relaxed">
              <p>Team,</p>
              <p>
                The proposal review pack for{' '}
                <strong>{tender?.title}</strong> ({tender?.agency}) is ready for partner sign-off.
              </p>

              <div className="p-2 bg-white border border-slate-200 rounded space-y-1">
                <div>
                  • <strong>Fit Score:</strong> {tender?.fitScore}/100 (Recommendation:{' '}
                  {tender?.recommendation.toUpperCase()})
                </div>
                <div>
                  • <strong>Proposed Team:</strong> {currentProposal.team.join(', ')}
                </div>
                <div>
                  • <strong>Flags:</strong> {unsupportedClaims.length} unsupported claim(s),{' '}
                  {complianceGaps.length} compliance item(s) acknowledged.
                </div>
                <div>
                  • <strong>Draft Link:</strong> /proposals?id={currentProposal.id}
                </div>
              </div>

              <p>
                Please review and approve the bid decision before submission deadline ({tender?.deadline}).
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button variant="secondary" onClick={() => setShowReviewPackModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={isSendingReview}
              onClick={handleSendReviewPack}
            >
              {isSendingReview ? 'Sending email...' : 'Send review email'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

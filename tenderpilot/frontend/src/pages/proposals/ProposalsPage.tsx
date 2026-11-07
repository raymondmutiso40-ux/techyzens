import React, { useState } from 'react';
import {
  PageHeader,
  Button,
  Modal,
  Badge,
  Select,
  EmptyState
} from '../../components/ui';
import { useApp } from '../../context/AppContext';
import type { GeneratedProposal, ProposalSection } from '../../data/mockData';

export const ProposalsPage: React.FC = () => {
  const {
    proposals,
    tenders,
    activeProposal,
    setActiveProposal,
    updateProposalContent,
    createProposalForTender,
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

  // New Generation modal
  const [showGenModal, setShowGenModal] = useState(false);
  const [selectedTenderId, setSelectedTenderId] = useState(tenders[0]?.id || '');
  const [templateType, setTemplateType] = useState('technical');
  const [isGenerating, setIsGenerating] = useState(false);

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
      const newProp = createProposalForTender(selectedTenderId);
      setActiveProposal(newProp);
      setSelectedSection(newProp.sections[0]);
      setEditingContent(newProp.sections[0]?.content || '');
      setIsGenerating(false);
      setShowGenModal(false);
      showNotice('Draft generated.');
    }, 800);
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
        <div className="flex items-center gap-2">
          <Button size="sm" variant="secondary" onClick={() => setShowGenModal(true)}>
            New draft
          </Button>
          <Button size="sm" variant="secondary" onClick={handleCopyProposal}>
            {copied ? 'Copied' : 'Copy text'}
          </Button>
          <Button size="sm" variant="secondary" onClick={() => window.print()}>
            Print / PDF
          </Button>
          <Button size="sm" variant="primary" onClick={handleExportDocx}>
            Export .docx
          </Button>
        </div>
      </PageHeader>

      {notice && (
        <div className="p-2.5 bg-slate-100 border border-slate-300 text-slate-800 rounded text-xs">
          {notice}
        </div>
      )}

      {/* 3-column layout: Sections (3) | Editor (6) | Evidence Grounding (3) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Sections list */}
        <div className="lg:col-span-3 bg-white border border-slate-200 rounded-md p-3 space-y-3">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
              Sections
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

        {/* Center editor */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-md p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">{selectedSection.title}</h2>
              <p className="text-[11px] text-slate-500">Grounded in firm CVs and past proposals</p>
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
              rows={16}
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

        {/* Right column: Grounding & Citations */}
        <div className="lg:col-span-3 bg-white border border-slate-200 rounded-md p-3 space-y-3">
          <div>
            <span className="text-[11px] font-semibold text-slate-900 uppercase tracking-wider block">
              Evidence Grounding
            </span>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Source claims linked to Knowledge Base documents.
            </p>
          </div>

          <div className="space-y-2">
            {selectedSection.citations.length > 0 ? (
              selectedSection.citations.map((cite, i) => (
                <div key={i} className="p-2.5 bg-slate-50 border border-slate-200 rounded text-xs space-y-1">
                  <div className="font-medium text-slate-900 text-[11px]">{cite.sourceDoc}</div>
                  {cite.pageRef && (
                    <div className="text-[10px] text-slate-500">{cite.pageRef}</div>
                  )}
                  <p className="text-[11px] text-slate-600 italic">"{cite.excerpt}"</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 p-2 text-center bg-slate-50 rounded">
                Procedural text without specific citations.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* New Draft Modal */}
      <Modal
        isOpen={showGenModal}
        onClose={() => setShowGenModal(false)}
        title="Generate Proposal Draft"
        description="Select a tender to generate a structured technical proposal."
      >
        <div className="space-y-3">
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
            label="Proposal structure template"
            value={templateType}
            onChange={(e) => setTemplateType(e.target.value)}
            options={[
              { value: 'technical', label: 'Technical Proposal (UN / Bilateral Standard)' },
              { value: 'eoi', label: 'Expression of Interest (EOI)' },
            ]}
          />

          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded text-xs text-slate-600">
            Sections will be structured from evaluation criteria and grounded with matched consultant CVs and past proposals.
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button variant="secondary" onClick={() => setShowGenModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" disabled={isGenerating} onClick={handleStartGeneration}>
              {isGenerating ? 'Generating draft...' : 'Generate draft'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

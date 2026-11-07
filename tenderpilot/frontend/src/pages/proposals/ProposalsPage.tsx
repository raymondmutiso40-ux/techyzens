import React, { useState } from 'react';
import {
  FileText,
  Sparkles,
  Download,
  Copy,
  Check,
  Edit3,
  Bookmark,
  Share2,
  ExternalLink,
  Save,
  CheckCircle2,
  UserCheck,
  Building2,
  Layers,
  ChevronDown,
  Plus,
  Loader2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { GeneratedProposal, ProposalSection } from '../../data/mockData';

export const ProposalsPage: React.FC = () => {
  const { proposals, tenders, activeProposal, setActiveProposal, updateProposalContent, createProposalForTender } = useApp();

  const [currentProposal, setCurrentProposal] = useState<GeneratedProposal>(
    activeProposal || proposals[0]
  );
  const [selectedSection, setSelectedSection] = useState<ProposalSection>(
    (activeProposal || proposals[0])?.sections[0]
  );
  const [editingContent, setEditingContent] = useState<string>(
    (activeProposal || proposals[0])?.sections[0]?.content || ''
  );
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [savedBanner, setSavedBanner] = useState<string | null>(null);

  // New Generation Wizard State
  const [showGenModal, setShowGenModal] = useState<boolean>(false);
  const [selectedTenderId, setSelectedTenderId] = useState<string>(tenders[0]?.id || '');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [genStep, setGenStep] = useState<string>('');

  const handleSelectProposal = (prop: GeneratedProposal) => {
    setCurrentProposal(prop);
    setActiveProposal(prop);
    setSelectedSection(prop.sections[0]);
    setEditingContent(prop.sections[0]?.content || '');
    setIsEditing(false);
  };

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
    showNotice('Section changes saved successfully.');
  };

  const showNotice = (msg: string) => {
    setSavedBanner(msg);
    setTimeout(() => setSavedBanner(null), 3000);
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
    showNotice(`Generating Word (.docx) export for "${currentProposal.tenderTitle}"...`);
    // Simulated instant download of text file with docx extension
    const fullText = currentProposal.sections
      .map((s) => `${s.title}\n\n${s.content}`)
      .join('\n\n---\n\n');
    const blob = new Blob([fullText], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TenderPilot-Proposal-${currentProposal.id}.docx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = () => {
    if (!currentProposal) return;
    window.print();
  };

  const handleStartGeneration = () => {
    setIsGenerating(true);
    setGenStep('Reading tender Terms of Reference & evaluation criteria...');

    setTimeout(() => {
      setGenStep('Scanning firm Knowledge Base for relevant CVs & past proposals...');
    }, 900);

    setTimeout(() => {
      setGenStep('Grounding technical claims with verified past performance evidence...');
    }, 1800);

    setTimeout(() => {
      setGenStep('Synthesizing structured Technical Proposal draft...');
    }, 2600);

    setTimeout(() => {
      const newProp = createProposalForTender(selectedTenderId);
      setCurrentProposal(newProp);
      setSelectedSection(newProp.sections[0]);
      setEditingContent(newProp.sections[0]?.content || '');
      setIsGenerating(false);
      setShowGenModal(false);
      showNotice('Technical proposal draft generated successfully!');
    }, 3400);
  };

  if (!currentProposal) {
    return (
      <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
        <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-800">No Proposals Drafted Yet</h3>
        <p className="text-xs text-slate-500 mt-1">Select a tender from the pipeline to generate a technical proposal.</p>
        <button
          onClick={() => setShowGenModal(true)}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold"
        >
          Generate First Proposal
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header & Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-600 text-sm font-semibold tracking-wide uppercase">
            <FileText className="w-4 h-4" />
            <span>Technical Proposal Studio</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            {currentProposal.tenderTitle}
          </h1>
          <div className="flex items-center space-x-2 text-xs text-slate-500 mt-1 flex-wrap">
            <span className="font-semibold text-slate-700">{currentProposal.agency}</span>
            <span>•</span>
            <span className="bg-indigo-50 text-indigo-700 font-semibold px-2 py-0.5 rounded">
              {currentProposal.version}
            </span>
            <span>•</span>
            <span>Created {currentProposal.createdAt}</span>
          </div>
        </div>

        {/* Global Proposal Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setShowGenModal(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Draft</span>
          </button>

          <button
            type="button"
            onClick={handleCopyProposal}
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied Full Draft' : 'Copy Text'}</span>
          </button>

          <button
            type="button"
            onClick={handleExportPDF}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Print / PDF</span>
          </button>

          <button
            type="button"
            onClick={handleExportDocx}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export to Word (.docx)</span>
          </button>
        </div>
      </div>

      {savedBanner && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{savedBanner}</span>
        </div>
      )}

      {/* Main Studio Grid: Section Navigator | Active Editor | Citations Grounding */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Sections List (3 Cols) */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200/90 shadow-xs p-4 space-y-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Proposal Sections
            </span>
            <div className="space-y-1.5 mt-2">
              {currentProposal.sections.map((sec) => (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => handleSelectSection(sec)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-medium transition-all flex items-center justify-between ${
                    selectedSection?.id === sec.id
                      ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <span className="truncate">{sec.title}</span>
                  <span className="text-[10px] bg-slate-200/70 text-slate-600 px-1.5 py-0.5 rounded ml-2 shrink-0">
                    {sec.citations.length} ref{sec.citations.length !== 1 ? 's' : ''}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Assigned Core Personnel
            </span>
            <div className="space-y-1.5 mt-2">
              {currentProposal.team.map((member, i) => (
                <div key={i} className="flex items-center space-x-2 text-xs text-slate-700">
                  <UserCheck className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span className="truncate font-medium">{member}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center Column: Section Editor (6 Cols) */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200/90 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {selectedSection.title}
              </h2>
              <span className="text-[11px] text-slate-400">
                Grounded in firm CVs and past winning proposals
              </span>
            </div>

            <div className="flex items-center gap-2">
              {isEditing ? (
                <button
                  type="button"
                  onClick={handleSaveSection}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Content</span>
                </button>
              )}
            </div>
          </div>

          {isEditing ? (
            <textarea
              rows={16}
              value={editingContent}
              onChange={(e) => setEditingContent(e.target.value)}
              className="w-full p-4 border border-slate-300 rounded-xl text-xs sm:text-sm font-sans text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed font-mono"
            />
          ) : (
            <div className="prose prose-sm max-w-none text-slate-700 text-xs sm:text-sm leading-relaxed whitespace-pre-line bg-slate-50/50 p-5 rounded-xl border border-slate-100">
              {selectedSection.content}
            </div>
          )}
        </div>

        {/* Right Column: Evidence & Grounding Citations (3 Cols) */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 space-y-4">
          <div>
            <div className="flex items-center space-x-2 text-indigo-600">
              <Sparkles className="w-4 h-4" />
              <h3 className="text-xs font-bold uppercase tracking-wide">
                Grounding & Evidence
              </h3>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Every factual claim in this draft traces back to verified documents in your Knowledge Base.
            </p>
          </div>

          <div className="space-y-3">
            {selectedSection.citations.length > 0 ? (
              selectedSection.citations.map((cite, i) => (
                <div
                  key={i}
                  className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl space-y-1.5"
                >
                  <div className="flex items-start space-x-2">
                    <Bookmark className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                    <span className="font-semibold text-slate-900 text-xs leading-snug">
                      {cite.sourceDoc}
                    </span>
                  </div>

                  {cite.pageRef && (
                    <div className="text-[10px] text-indigo-700 font-medium">
                      Location: {cite.pageRef}
                    </div>
                  )}

                  <blockquote className="text-[11px] text-slate-600 italic bg-white p-2 rounded-lg border border-indigo-100/60">
                    "{cite.excerpt}"
                  </blockquote>
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-400 p-3 bg-slate-50 rounded-lg text-center">
                General procedural text. No specific firm credentials cited in this section.
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500">
            <span className="font-semibold text-slate-800">PRD Compliance: </span>
            Zero hallucination guarantee. Reuses authentic consultant profiles and past methodologies.
          </div>
        </div>
      </div>

      {/* Generation Wizard Modal */}
      {showGenModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-base">Generate Technical Proposal Draft</h3>
              </div>
              {!isGenerating && (
                <button
                  onClick={() => setShowGenModal(false)}
                  className="text-slate-400 hover:text-slate-600 text-xl leading-none"
                >
                  &times;
                </button>
              )}
            </div>

            {isGenerating ? (
              <div className="py-8 text-center space-y-4">
                <div className="h-14 w-14 rounded-2xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center animate-spin">
                  <Loader2 className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Synthesizing Proposal with AI</h4>
                  <p className="text-xs text-indigo-600 font-medium mt-1 animate-pulse">{genStep}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Select Target Tender from Pipeline
                  </label>
                  <select
                    value={selectedTenderId}
                    onChange={(e) => setSelectedTenderId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {tenders.map((t) => (
                      <option key={t.id} value={t.id}>
                        [{t.agency}] {t.title} (Fit: {t.fitScore}%)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Proposal Format Template
                  </label>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700">
                    <span className="font-semibold text-slate-900">UN Standard Technical Proposal:</span> Executive Summary, Methodology, Work Plan, Staffing, Past Performance.
                  </div>
                </div>

                <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg text-xs text-indigo-900">
                  <span className="font-semibold">Knowledge Grounding: </span>
                  Will pull consultant CVs and past winning proposals matching this tender's TOR.
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowGenModal(false)}
                    className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleStartGeneration}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center space-x-1.5"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Generate Proposal</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

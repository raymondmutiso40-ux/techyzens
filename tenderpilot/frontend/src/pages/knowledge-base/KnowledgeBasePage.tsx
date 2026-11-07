import React, { useState } from 'react';
import {
  Database,
  UploadCloud,
  FileText,
  UserCheck,
  CheckCircle2,
  Trash2,
  Search,
  Plus,
  Sparkles,
  BookOpen,
  Filter,
  Eye,
  FileCheck2,
  Clock
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { KBDocument } from '../../data/mockData';

export const KnowledgeBasePage: React.FC = () => {
  const { documents, addDocument, deleteDocument } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<'DOCUMENTS' | 'CONSULTANTS'>('DOCUMENTS');
  const [previewDoc, setPreviewDoc] = useState<KBDocument | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // New document form modal
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [newDocName, setNewDocName] = useState('');
  const [newDocType, setNewDocType] = useState<'CV' | 'Past Proposal' | 'Capability Statement'>('CV');
  const [newConsultantName, setNewConsultantName] = useState('');
  const [newSkills, setNewSkills] = useState('');
  const [newSummary, setNewSummary] = useState('');

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch =
      doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.keySkills.some((s) => s.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (doc.consultantName && doc.consultantName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = selectedType === 'ALL' || doc.type === selectedType;
    return matchesSearch && matchesType;
  });

  const consultants = documents.filter((d) => d.type === 'CV' && d.consultantName);

  const handleCreateDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocName) return;

    setIsUploading(true);
    setTimeout(() => {
      addDocument({
        name: newDocName.endsWith('.pdf') || newDocName.endsWith('.docx') ? newDocName : `${newDocName}.pdf`,
        type: newDocType,
        size: '1.8 MB',
        consultantName: newDocType === 'CV' ? newConsultantName : undefined,
        keySkills: newSkills ? newSkills.split(',').map((s) => s.trim()) : ['Public Sector', 'Advisory'],
        summary: newSummary || 'Parsed institutional profile and key performance records.',
      });
      setIsUploading(false);
      setShowUploadModal(false);
      // reset
      setNewDocName('');
      setNewConsultantName('');
      setNewSkills('');
      setNewSummary('');
    }, 600);
  };

  const handleQuickAddCV = () => {
    addDocument({
      name: 'Dr. Amina Mohamed - Public Health Policy Expert CV.pdf',
      type: 'CV',
      size: '1.2 MB',
      consultantName: 'Dr. Amina Mohamed',
      keySkills: ['Epidemiology', 'Vaccine Rollout', 'Health Economics', 'UNICEF / WHO'],
      summary: '11 years advising African Union and WHO on sub-national immunization supply chains and health financing.',
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-600 text-sm font-semibold tracking-wide uppercase">
            <Database className="w-4 h-4" />
            <span>Firm Repository</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mt-1">
            Knowledge Base: CVs & Proposals
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Upload and index your firm's consultant CVs, past proposals, and capability statements.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleQuickAddCV}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-xs font-semibold transition-colors"
          >
            <Plus className="w-4 h-4 text-slate-500" />
            <span>+ Sample CV</span>
          </button>
          <button
            type="button"
            onClick={() => setShowUploadModal(true)}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-xs"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Document</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 space-x-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('DOCUMENTS')}
          className={`pb-3 transition-colors flex items-center space-x-2 border-b-2 -mb-px ${
            activeTab === 'DOCUMENTS'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>All Documents ({documents.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('CONSULTANTS')}
          className={`pb-3 transition-colors flex items-center space-x-2 border-b-2 -mb-px ${
            activeTab === 'CONSULTANTS'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Extracted Consultant Roster ({consultants.length})</span>
        </button>
      </div>

      {activeTab === 'DOCUMENTS' ? (
        <>
          {/* Search & Filter Toolbar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-96">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search by document, consultant, skill..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-slate-400 shrink-0" />
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-3 py-2 text-xs font-medium border border-slate-300 rounded-lg text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">All File Types</option>
                <option value="CV">Consultant CVs</option>
                <option value="Past Proposal">Past Proposals</option>
                <option value="Capability Statement">Capability Statements</option>
              </select>
            </div>
          </div>

          {/* Document Table / List */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="divide-y divide-slate-100">
              {filteredDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="p-4 sm:p-5 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start space-x-3.5 min-w-0">
                    <div
                      className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${
                        doc.type === 'CV'
                          ? 'bg-blue-50 text-blue-600'
                          : doc.type === 'Past Proposal'
                          ? 'bg-purple-50 text-purple-600'
                          : 'bg-emerald-50 text-emerald-600'
                      }`}
                    >
                      <FileText className="w-5 h-5" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        <span className="font-semibold text-slate-900 text-sm">{doc.name}</span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                            doc.type === 'CV'
                              ? 'bg-blue-100 text-blue-800'
                              : doc.type === 'Past Proposal'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {doc.type}
                        </span>
                        <span className="inline-flex items-center text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-medium">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          {doc.status}
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 mt-1 line-clamp-1">{doc.summary}</p>

                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {doc.keySkills.map((skill) => (
                          <span
                            key={skill}
                            className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-3 text-xs text-slate-500 shrink-0 border-t md:border-t-0 pt-2 md:pt-0">
                    <div className="text-right">
                      <div>{doc.size}</div>
                      <div className="text-[11px] text-slate-400">{doc.uploadedAt}</div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setPreviewDoc(doc)}
                        className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Preview Parsed Content"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteDocument(doc.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Remove Document"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredDocs.length === 0 && (
              <div className="p-12 text-center text-slate-500">
                <FileCheck2 className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <p className="text-sm font-medium">No documents match your filter.</p>
              </div>
            )}
          </div>
        </>
      ) : (
        /* Consultants View */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {consultants.map((cv) => (
            <div
              key={cv.id}
              className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs hover:border-indigo-200 transition-all space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-11 w-11 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-sm">
                    {cv.consultantName
                      ?.split(' ')
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 text-sm">{cv.consultantName}</h3>
                    <span className="text-xs text-indigo-600 font-medium">Key Personnel / Consultant</span>
                  </div>
                </div>
                <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full font-medium">
                  Verified CV
                </span>
              </div>

              <p className="text-xs text-slate-600">{cv.summary}</p>

              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                  Extracted Core Capabilities
                </span>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {cv.keySkills.map((skill) => (
                    <span
                      key={skill}
                      className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <UploadCloud className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-base">Upload to Knowledge Base</h3>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateDocument} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Document Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['CV', 'Past Proposal', 'Capability Statement'] as const).map((t) => (
                    <button
                      type="button"
                      key={t}
                      onClick={() => setNewDocType(t)}
                      className={`py-2 px-2 text-xs font-semibold rounded-lg border transition-all text-center ${
                        newDocType === t
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Document Title / File Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. John Doe - Health Systems Specialist CV.pdf"
                  value={newDocName}
                  onChange={(e) => setNewDocName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {newDocType === 'CV' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Consultant Full Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Dr. John Doe"
                    value={newConsultantName}
                    onChange={(e) => setNewConsultantName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Key Skills & Sectors (comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Public Finance, IFMIS, Treasury, East Africa"
                  value={newSkills}
                  onChange={(e) => setNewSkills(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Summary / Overview
                </label>
                <textarea
                  rows={2}
                  placeholder="Short description of this document's track record or qualifications..."
                  value={newSummary}
                  onChange={(e) => setNewSummary(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs"
                >
                  {isUploading ? 'Parsing & Indexing...' : 'Index Document'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-base">{previewDoc.name}</h3>
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1">
                <div><strong>Type:</strong> {previewDoc.type}</div>
                <div><strong>Status:</strong> {previewDoc.status}</div>
                <div><strong>Indexed:</strong> {previewDoc.uploadedAt}</div>
              </div>

              <div>
                <h4 className="font-semibold text-slate-900 text-xs uppercase mb-1">
                  Extracted Executive Summary
                </h4>
                <p className="text-slate-600 text-xs leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200">
                  {previewDoc.summary}
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-slate-900 text-xs uppercase mb-1">
                  Indexed Capability Tags
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {previewDoc.keySkills.map((s) => (
                    <span
                      key={s}
                      className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-medium"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setPreviewDoc(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

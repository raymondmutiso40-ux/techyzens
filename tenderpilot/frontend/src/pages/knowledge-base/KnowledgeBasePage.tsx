import React, { useState } from 'react';
import {
  PageHeader,
  Button,
  Tabs,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  StatusDot,
  Modal,
  Input,
  Select,
  EmptyState
} from '../../components/ui';
import { useApp } from '../../context/AppContext';
import type { KBDocument } from '../../data/mockData';

export const KnowledgeBasePage: React.FC = () => {
  const { documents, addDocument, deleteDocument } = useApp();
  const [activeTab, setActiveTab] = useState<'DOCUMENTS' | 'CONSULTANTS'>('DOCUMENTS');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');
  const [previewDoc, setPreviewDoc] = useState<KBDocument | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Form state
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

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocName) return;

    addDocument({
      name: newDocName.endsWith('.pdf') || newDocName.endsWith('.docx') ? newDocName : `${newDocName}.pdf`,
      type: newDocType,
      size: '1.4 MB',
      consultantName: newDocType === 'CV' ? newConsultantName : undefined,
      keySkills: newSkills ? newSkills.split(',').map((s) => s.trim()) : ['Consulting'],
      summary: newSummary || 'Parsed profile and capability record.',
    });

    setShowUploadModal(false);
    setNewDocName('');
    setNewConsultantName('');
    setNewSkills('');
    setNewSummary('');
  };

  return (
    <div className="space-y-4">
      <PageHeader
        category="Repository"
        title="Knowledge Base"
        description="Searchable firm CVs, past proposals, and capability statements."
      >
        <Button variant="primary" onClick={() => setShowUploadModal(true)}>
          Upload document
        </Button>
      </PageHeader>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
        <Tabs
          activeTab={activeTab}
          onChange={(id) => setActiveTab(id as any)}
          tabs={[
            { id: 'DOCUMENTS', label: 'Documents', count: documents.length },
            { id: 'CONSULTANTS', label: 'Consultant roster', count: consultants.length },
          ]}
        />

        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Filter by keyword or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-8 px-2.5 text-xs bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-600 w-56"
          />
          {activeTab === 'DOCUMENTS' && (
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="h-8 px-2 text-xs bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-600 text-slate-700"
            >
              <option value="ALL">All types</option>
              <option value="CV">CVs</option>
              <option value="Past Proposal">Past proposals</option>
              <option value="Capability Statement">Capability statements</option>
            </select>
          )}
        </div>
      </div>

      {activeTab === 'DOCUMENTS' ? (
        filteredDocs.length > 0 ? (
          <Table>
            <Thead>
              <Tr>
                <Th>Document name</Th>
                <Th>Type</Th>
                <Th>Size</Th>
                <Th>Uploaded</Th>
                <Th>Status</Th>
                <Th className="text-right">Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filteredDocs.map((doc) => (
                <Tr key={doc.id}>
                  <Td className="font-medium text-slate-900">
                    <div>{doc.name}</div>
                    {doc.keySkills.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {doc.keySkills.slice(0, 3).map((s) => (
                          <span key={s} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded">
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </Td>
                  <Td>
                    <Badge variant="neutral">{doc.type}</Badge>
                  </Td>
                  <Td className="text-slate-500 text-xs">{doc.size}</Td>
                  <Td className="text-slate-500 text-xs">{doc.uploadedAt}</Td>
                  <Td>
                    <StatusDot status="green" label={doc.status} />
                  </Td>
                  <Td className="text-right space-x-2">
                    <button
                      type="button"
                      onClick={() => setPreviewDoc(doc)}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      View
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteDocument(doc.id)}
                      className="text-xs text-slate-400 hover:text-red-600"
                    >
                      Delete
                    </button>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        ) : (
          <EmptyState
            title="No documents found"
            description="Upload CVs or past proposals to index them for tender matching."
            action={
              <Button size="sm" variant="secondary" onClick={() => setShowUploadModal(true)}>
                Upload document
              </Button>
            }
          />
        )
      ) : consultants.length > 0 ? (
        <Table>
          <Thead>
            <Tr>
              <Th>Consultant</Th>
              <Th>Extracted expertise</Th>
              <Th>Source document</Th>
              <Th className="text-right">Action</Th>
            </Tr>
          </Thead>
          <Tbody>
            {consultants.map((c) => (
              <Tr key={c.id}>
                <Td className="font-medium text-slate-900">
                  <div>{c.consultantName}</div>
                  <div className="text-[11px] text-slate-500 line-clamp-1">{c.summary}</div>
                </Td>
                <Td>
                  <div className="flex flex-wrap gap-1">
                    {c.keySkills.map((s) => (
                      <Badge key={s} variant="neutral">
                        {s}
                      </Badge>
                    ))}
                  </div>
                </Td>
                <Td className="text-xs text-slate-500">{c.name}</Td>
                <Td className="text-right">
                  <button
                    type="button"
                    onClick={() => setPreviewDoc(c)}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    View profile
                  </button>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      ) : (
        <EmptyState
          title="No consultants indexed"
          description="Upload consultant CVs to index them in the roster."
          action={
            <Button size="sm" variant="secondary" onClick={() => setShowUploadModal(true)}>
              Upload CV
            </Button>
          }
        />
      )}

      {/* Upload Modal */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        title="Upload Document"
        description="Index firm documents for tender scoring and proposal generation."
      >
        <form onSubmit={handleUploadSubmit} className="space-y-3">
          <Select
            label="Document type"
            value={newDocType}
            onChange={(e) => setNewDocType(e.target.value as any)}
            options={[
              { value: 'CV', label: 'Consultant CV' },
              { value: 'Past Proposal', label: 'Past Technical Proposal' },
              { value: 'Capability Statement', label: 'Capability Statement' },
            ]}
          />

          <Input
            label="File or document name"
            placeholder="e.g. Dr. John Doe - Senior Health Advisor CV.pdf"
            value={newDocName}
            onChange={(e) => setNewDocName(e.target.value)}
            required
          />

          {newDocType === 'CV' && (
            <Input
              label="Consultant name"
              placeholder="e.g. Dr. John Doe"
              value={newConsultantName}
              onChange={(e) => setNewConsultantName(e.target.value)}
              required
            />
          )}

          <Input
            label="Extracted skills & sectors (comma-separated)"
            placeholder="e.g. Public Financial Management, IFMIS, Kenya"
            value={newSkills}
            onChange={(e) => setNewSkills(e.target.value)}
          />

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Summary</label>
            <textarea
              rows={3}
              value={newSummary}
              onChange={(e) => setNewSummary(e.target.value)}
              placeholder="Brief overview of credentials and track record..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600 text-slate-900"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={() => setShowUploadModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Upload and index
            </Button>
          </div>
        </form>
      </Modal>

      {/* Preview Modal */}
      {previewDoc && (
        <Modal
          isOpen={Boolean(previewDoc)}
          onClose={() => setPreviewDoc(null)}
          title={previewDoc.name}
          description={`${previewDoc.type} · ${previewDoc.size} · Uploaded ${previewDoc.uploadedAt}`}
        >
          <div className="space-y-3 text-xs">
            <div>
              <span className="font-medium text-slate-700 block mb-1">Summary</span>
              <p className="text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-200 leading-relaxed">
                {previewDoc.summary}
              </p>
            </div>

            <div>
              <span className="font-medium text-slate-700 block mb-1">Extracted tags</span>
              <div className="flex flex-wrap gap-1">
                {previewDoc.keySkills.map((s) => (
                  <Badge key={s} variant="neutral">
                    {s}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <Button size="sm" variant="secondary" onClick={() => setPreviewDoc(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

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
  StatusDot
} from '../../components/ui';
import { useApp } from '../../context/AppContext';
import type { Tender } from '../../data/mockData';

export const TendersPage: React.FC = () => {
  const { tenders, createProposalForTender } = useApp();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSector, setSelectedSector] = useState('ALL');
  const [minFitScore, setMinFitScore] = useState(0);
  const [selectedTender, setSelectedTender] = useState<Tender | null>(null);

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

  const handleGenerateProposal = (tenderId: string) => {
    createProposalForTender(tenderId);
    navigate('/proposals');
  };

  const getScoreBadge = (score: number) => {
    if (score >= 85) return <Badge variant="success">{score} · Strong</Badge>;
    if (score >= 70) return <Badge variant="info">{score} · Moderate</Badge>;
    return <Badge variant="warning">{score} · Low</Badge>;
  };

  return (
    <div className="space-y-4">
      <PageHeader
        category="Discovery"
        title="Tender Discovery"
        description="Active procurement notices scored against firm capabilities."
      >
        <span className="text-xs text-slate-500">Monitoring: UNGM</span>
      </PageHeader>

      {/* Filter toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 border border-slate-200 rounded-md">
        <div className="flex items-center gap-2 flex-1">
          <input
            type="text"
            placeholder="Search tenders by title, agency, or reference..."
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
              <Th>Tender title</Th>
              <Th>Donor / Agency</Th>
              <Th>Sector</Th>
              <Th>Deadline</Th>
              <Th>Fit score</Th>
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
                <Td className="text-xs text-slate-500 whitespace-nowrap">{tender.sector}</Td>
                <Td className="text-xs text-slate-600 whitespace-nowrap">{tender.deadline}</Td>
                <Td className="whitespace-nowrap">{getScoreBadge(tender.fitScore)}</Td>
                <Td className="text-right whitespace-nowrap space-x-2">
                  <button
                    type="button"
                    onClick={() => setSelectedTender(tender)}
                    className="text-xs text-slate-700 hover:underline"
                  >
                    View
                  </button>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => handleGenerateProposal(tender.id)}
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
            {/* Fit summary */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded flex items-start justify-between gap-3">
              <div>
                <span className="font-semibold text-slate-800 block mb-0.5">Scoring reason</span>
                <p className="text-slate-600">{selectedTender.fitReason}</p>
              </div>
              <div className="shrink-0">{getScoreBadge(selectedTender.fitScore)}</div>
            </div>

            <div>
              <span className="font-semibold text-slate-800 block mb-1">Summary</span>
              <p className="text-slate-600 leading-relaxed">{selectedTender.summary}</p>
            </div>

            <div>
              <span className="font-semibold text-slate-800 block mb-1">Requirements</span>
              <ul className="list-disc pl-4 text-slate-600 space-y-1">
                {selectedTender.requirements.map((req, i) => (
                  <li key={i}>{req}</li>
                ))}
              </ul>
            </div>

            {selectedTender.matchedConsultants.length > 0 && (
              <div>
                <span className="font-semibold text-slate-800 block mb-1">
                  Matched consultants
                </span>
                <div className="space-y-1">
                  {selectedTender.matchedConsultants.map((c, i) => (
                    <div
                      key={i}
                      className="p-2 bg-slate-50 border border-slate-200 rounded text-slate-700"
                    >
                      {c}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between items-center pt-3 border-t border-slate-100">
              <Button size="sm" variant="secondary" onClick={() => setSelectedTender(null)}>
                Close
              </Button>
              <Button
                size="sm"
                variant="primary"
                onClick={() => {
                  handleGenerateProposal(selectedTender.id);
                  setSelectedTender(null);
                }}
              >
                Generate draft
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

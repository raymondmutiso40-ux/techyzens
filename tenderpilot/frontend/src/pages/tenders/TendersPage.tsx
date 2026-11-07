import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Compass,
  Sparkles,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Calendar,
  DollarSign,
  ArrowRight,
  FileText,
  UserCheck,
  ChevronRight,
  SlidersHorizontal,
  ExternalLink
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { Tender } from '../../data/mockData';

export const TendersPage: React.FC = () => {
  const { tenders, createProposalForTender } = useApp();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSector, setSelectedSector] = useState<string>('ALL');
  const [minFitScore, setMinFitScore] = useState<number>(0);
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
    const proposal = createProposalForTender(tenderId);
    navigate(`/proposals`);
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-emerald-700 bg-emerald-50 border-emerald-200 ring-emerald-500/20';
    if (score >= 70) return 'text-blue-700 bg-blue-50 border-blue-200 ring-blue-500/20';
    return 'text-amber-700 bg-amber-50 border-amber-200 ring-amber-500/20';
  };

  const getBadgeColor = (score: number) => {
    if (score >= 85) return 'bg-emerald-600 text-white';
    if (score >= 70) return 'bg-blue-600 text-white';
    return 'bg-amber-500 text-white';
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-600 text-sm font-semibold tracking-wide uppercase">
            <Compass className="w-4 h-4" />
            <span>Opportunity Pipeline</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mt-1">
            Tender Discovery
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            AI-monitored procurement portals ranked with fit scores against your firm's capability profile.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-lg text-xs font-semibold text-indigo-700 flex items-center space-x-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Monitoring 1 Source (UNGM)</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search tenders by keyword, agency, ref..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span>Sector:</span>
              <select
                value={selectedSector}
                onChange={(e) => setSelectedSector(e.target.value)}
                className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">All Sectors</option>
                <option value="Digital Transformation & IT">Digital Transformation & IT</option>
                <option value="Public Financial Management">Public Financial Management</option>
                <option value="Healthcare & Life Sciences">Healthcare & Life Sciences</option>
                <option value="Energy & Infrastructure">Energy & Infrastructure</option>
              </select>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
              <span>Min Fit:</span>
              <button
                type="button"
                onClick={() => setMinFitScore(minFitScore === 70 ? 0 : 70)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                  minFitScore > 0
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {minFitScore > 0 ? '≥ 70% Match Only' : 'Show All'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tender Cards Feed */}
      <div className="space-y-4">
        {filteredTenders.map((tender) => (
          <div
            key={tender.id}
            className="bg-white rounded-xl border border-slate-200/90 shadow-xs hover:border-indigo-300 transition-all p-5 sm:p-6 space-y-4"
          >
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                  <span className="font-mono text-xs text-slate-400 uppercase font-semibold">
                    {tender.referenceNumber}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="text-xs text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full font-semibold">
                    {tender.agency}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="text-xs text-slate-500 font-medium">
                    {tender.country} ({tender.region})
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 leading-snug">
                  {tender.title}
                </h3>

                <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
                  {tender.summary}
                </p>
              </div>

              {/* Fit Score Gauge Card */}
              <div
                className={`px-4 py-3 rounded-xl border ring-1 shrink-0 text-center min-w-[120px] ${getScoreColor(
                  tender.fitScore
                )}`}
              >
                <div className="text-2xl font-black tracking-tight">{tender.fitScore}%</div>
                <div className="text-[11px] font-bold uppercase tracking-wider mt-0.5">
                  Fit Score
                </div>
              </div>
            </div>

            {/* AI Fit Reasoning Banner */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-700 flex items-start space-x-2.5">
              <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900 font-semibold">Why this fits your firm: </strong>
                {tender.fitReason}
              </div>
            </div>

            {/* Footer / Meta & Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
              <div className="flex items-center space-x-4 text-xs text-slate-500 flex-wrap gap-y-1">
                <span className="flex items-center space-x-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{tender.deadline}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                  <span>{tender.budgetEst}</span>
                </span>
                <span className="text-slate-400">Source: {tender.source}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedTender(tender)}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1"
                >
                  <span>Review Fit Breakdown</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleGenerateProposal(tender.id)}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1.5 shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Draft Proposal</span>
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredTenders.length === 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
            <Compass className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-medium">No tenders match your current filter criteria.</p>
          </div>
        )}
      </div>

      {/* Tender Fit Analysis Detail Modal */}
      {selectedTender && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs font-mono text-indigo-600 font-semibold uppercase">
                  {selectedTender.referenceNumber}
                </span>
                <h3 className="font-bold text-slate-900 text-lg mt-0.5 leading-snug">
                  {selectedTender.title}
                </h3>
                <div className="text-xs text-slate-500 mt-1">{selectedTender.agency} • {selectedTender.country}</div>
              </div>
              <button
                onClick={() => setSelectedTender(null)}
                className="text-slate-400 hover:text-slate-600 text-xl leading-none"
              >
                &times;
              </button>
            </div>

            {/* Score pill */}
            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <div className="space-y-0.5">
                <div className="text-xs font-semibold uppercase text-slate-500">
                  AI Fit Assessment
                </div>
                <div className="text-sm text-slate-800 font-medium">
                  {selectedTender.fitReason}
                </div>
              </div>
              <span className={`px-3 py-1.5 rounded-lg text-sm font-black ${getBadgeColor(selectedTender.fitScore)}`}>
                {selectedTender.fitScore}%
              </span>
            </div>

            {/* Requirements check */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Key Requirements & TOR Evaluation
              </h4>
              <div className="space-y-1.5">
                {selectedTender.requirements.map((req, i) => (
                  <div key={i} className="flex items-start space-x-2 text-xs text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{req}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Matched Consultants */}
            {selectedTender.matchedConsultants.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  Matched Consultant Profiles from Knowledge Base
                </h4>
                <div className="space-y-1.5">
                  {selectedTender.matchedConsultants.map((c, i) => (
                    <div
                      key={i}
                      className="p-2.5 bg-indigo-50/50 border border-indigo-100 rounded-lg text-xs text-indigo-900 flex items-center space-x-2"
                    >
                      <UserCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span className="font-semibold">{c}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Matched Past Proposals */}
            {selectedTender.matchedProposals.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  Reusable Content from Past Winning Proposals
                </h4>
                <div className="space-y-1.5">
                  {selectedTender.matchedProposals.map((p, i) => (
                    <div
                      key={i}
                      className="p-2.5 bg-purple-50/50 border border-purple-100 rounded-lg text-xs text-purple-900 flex items-center space-x-2"
                    >
                      <FileText className="w-4 h-4 text-purple-600 shrink-0" />
                      <span className="font-semibold">{p}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex justify-between items-center pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedTender(null)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Back to Feed
              </button>
              <button
                type="button"
                onClick={() => {
                  handleGenerateProposal(selectedTender.id);
                  setSelectedTender(null);
                }}
                className="inline-flex items-center space-x-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs"
              >
                <Sparkles className="w-4 h-4" />
                <span>Generate Proposal Draft</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

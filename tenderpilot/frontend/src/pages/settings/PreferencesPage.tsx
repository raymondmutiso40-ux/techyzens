import React, { useState } from 'react';
import {
  Sliders,
  Globe2,
  Layers,
  Search,
  CheckCircle2,
  Plus,
  X,
  Radio,
  Save
} from 'lucide-react';

interface SourceOption {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

const defaultSources: SourceOption[] = [
  {
    id: 'ungm',
    name: 'United Nations Global Marketplace (UNGM)',
    description: 'UN Secretariat, UNDP, UNICEF, WHO, UNOPS & 30+ UN agencies',
    enabled: true,
  },
  {
    id: 'worldbank',
    name: 'World Bank Procurement',
    description: 'International development & consultancy tenders worldwide',
    enabled: false,
  },
  {
    id: 'afdb',
    name: 'African Development Bank (AfDB)',
    description: 'Infrastructure, technology & governance tenders across Africa',
    enabled: false,
  },
];

const availableSectors = [
  'Digital Transformation & IT',
  'Public Financial Management',
  'Healthcare & Life Sciences',
  'Agriculture & Food Security',
  'Energy & Infrastructure',
  'Governance & Public Sector Reform',
];

const availableRegions = [
  'East Africa',
  'West Africa',
  'Southern Africa',
  'Pan-African',
  'Global / Remote',
];

export const PreferencesPage: React.FC = () => {
  const [sources, setSources] = useState<SourceOption[]>(defaultSources);
  const [sectors, setSectors] = useState<string[]>([
    'Digital Transformation & IT',
    'Public Financial Management',
  ]);
  const [regions, setRegions] = useState<string[]>(['East Africa']);
  const [keywords, setKeywords] = useState<string[]>([
    'Technical Proposal',
    'Feasibility Study',
    'Consulting',
  ]);
  const [newKeyword, setNewKeyword] = useState('');
  const [savedMessage, setSavedMessage] = useState(false);

  const toggleSource = (id: string) => {
    setSources((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );
  };

  const toggleSector = (sector: string) => {
    setSectors((prev) =>
      prev.includes(sector) ? prev.filter((s) => s !== sector) : [...prev, sector]
    );
  };

  const toggleRegion = (region: string) => {
    setRegions((prev) =>
      prev.includes(region) ? prev.filter((r) => r !== region) : [...prev, region]
    );
  };

  const handleAddKeyword = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newKeyword.trim();
    if (trimmed && !keywords.includes(trimmed)) {
      setKeywords((prev) => [...prev, trimmed]);
      setNewKeyword('');
    }
  };

  const handleRemoveKeyword = (kwToRemove: string) => {
    setKeywords((prev) => prev.filter((kw) => kw !== kwToRemove));
  };

  const handleSave = () => {
    setSavedMessage(true);
    setTimeout(() => {
      setSavedMessage(false);
    }, 4000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Page Header */}
      <div>
        <div className="flex items-center space-x-2 text-indigo-600 text-sm font-semibold tracking-wide uppercase">
          <Sliders className="w-4 h-4" />
          <span>Firm Configuration</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mt-1">
          Tender Preferences
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Configure what kind of tenders TenderPilot monitors and evaluates for your consultancy firm.
        </p>
      </div>

      {savedMessage && (
        <div className="flex items-center space-x-3 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl transition-all shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div className="font-medium text-sm">Preferences saved successfully. New tender crawling will apply these rules.</div>
        </div>
      )}

      {/* Tender Sources */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center space-x-2">
          <Radio className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg font-semibold text-slate-900">Tender Sources to Monitor</h2>
        </div>
        <p className="text-xs text-slate-500">
          Select portal sources TenderPilot continuously watches for open opportunities.
        </p>
        <div className="space-y-3 pt-2">
          {sources.map((source) => (
            <label
              key={source.id}
              className={`flex items-start space-x-3 p-3.5 rounded-lg border transition-colors cursor-pointer ${
                source.enabled
                  ? 'border-indigo-300 bg-indigo-50/40'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <input
                type="checkbox"
                checked={source.enabled}
                onChange={() => toggleSource(source.id)}
                aria-label={source.name}
                className="mt-1 h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
              />
              <div className="flex-1">
                <div className="text-sm font-medium text-slate-900">{source.name}</div>
                <div className="text-xs text-slate-500 mt-0.5">{source.description}</div>
              </div>
            </label>
          ))}
        </div>
      </section>

      {/* Target Sectors */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center space-x-2">
          <Layers className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg font-semibold text-slate-900">Target Sectors</h2>
        </div>
        <p className="text-xs text-slate-500">
          Only score tenders that match your practice areas.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
          {availableSectors.map((sector) => {
            const isSelected = sectors.includes(sector);
            return (
              <button
                type="button"
                key={sector}
                onClick={() => toggleSector(sector)}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg border text-sm font-medium transition-all text-left ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-600 text-white shadow-xs'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <span>{sector}</span>
                {isSelected && <CheckCircle2 className="w-4 h-4 ml-2 shrink-0" />}
              </button>
            );
          })}
        </div>
      </section>

      {/* Target Regions */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center space-x-2">
          <Globe2 className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg font-semibold text-slate-900">Target Regions</h2>
        </div>
        <div className="flex flex-wrap gap-2 pt-2">
          {availableRegions.map((region) => {
            const isSelected = regions.includes(region);
            return (
              <button
                type="button"
                key={region}
                onClick={() => toggleRegion(region)}
                className={`px-4 py-2 rounded-full text-xs font-semibold tracking-wide transition-all ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {region}
              </button>
            );
          })}
        </div>
      </section>

      {/* Target Keywords */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center space-x-2">
          <Search className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg font-semibold text-slate-900">Keywords</h2>
        </div>
        <p className="text-xs text-slate-500">
          Specific keywords or skills you want to prioritize in fit ranking.
        </p>

        <form onSubmit={handleAddKeyword} className="flex gap-2">
          <input
            type="text"
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            placeholder="Add keyword (e.g. AI Agent, Enterprise Architecture)..."
            className="flex-1 px-3.5 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add</span>
          </button>
        </form>

        <div className="flex flex-wrap gap-2 pt-2">
          {keywords.map((kw) => (
            <span
              key={kw}
              className="inline-flex items-center space-x-1.5 px-3 py-1 bg-slate-100 border border-slate-200 text-slate-800 rounded-lg text-xs font-medium"
            >
              <span>{kw}</span>
              <button
                type="button"
                aria-label={`Remove ${kw}`}
                onClick={() => handleRemoveKeyword(kw)}
                className="text-slate-400 hover:text-rose-600 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}
        </div>
      </section>

      {/* Save Button */}
      <div className="flex justify-end pt-2 pb-6">
        <button
          type="button"
          onClick={handleSave}
          className="inline-flex items-center space-x-2 px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-semibold text-sm hover:bg-indigo-700 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <Save className="w-4 h-4" />
          <span>Save Preferences</span>
        </button>
      </div>
    </div>
  );
};

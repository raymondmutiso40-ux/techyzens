import React, { useState } from 'react';
import { PageHeader, Button, Input } from '../../components/ui';
import { X } from 'lucide-react';

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
    description: 'UN Secretariat, UNDP, UNICEF, WHO, UNOPS procurement portals',
    enabled: true,
  },
  {
    id: 'worldbank',
    name: 'World Bank Procurement',
    description: 'International development & consultancy notices',
    enabled: false,
  },
  {
    id: 'afdb',
    name: 'African Development Bank (AfDB)',
    description: 'Infrastructure, technology & governance notices',
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
  const [dailyDigest, setDailyDigest] = useState(true);
  const [savedNotice, setSavedNotice] = useState(false);

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

  const handleRemoveKeyword = (kw: string) => {
    setKeywords((prev) => prev.filter((k) => k !== kw));
  };

  const handleSave = () => {
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        category="Configuration"
        title="Tender Preferences"
        description="Filter settings for automated discovery and scoring."
      >
        <Button variant="primary" onClick={handleSave}>
          Save preferences
        </Button>
      </PageHeader>

      {savedNotice && (
        <div className="p-3 bg-slate-100 border border-slate-300 text-slate-800 rounded text-xs">
          Preferences saved successfully.
        </div>
      )}

      {/* Sources */}
      <section className="bg-white border border-slate-200 rounded-md p-4 space-y-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Tender Sources to Monitor</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Active procurement feeds monitored for notices.
          </p>
        </div>

        <div className="divide-y divide-slate-100">
          {sources.map((src) => (
            <label
              key={src.id}
              className="flex items-start gap-3 py-2.5 cursor-pointer text-xs"
            >
              <input
                type="checkbox"
                checked={src.enabled}
                onChange={() => toggleSource(src.id)}
                aria-label={src.name}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-1 focus:ring-blue-600"
              />
              <div className="flex-1">
                <span className="font-medium text-slate-900">{src.name}</span>
                <p className="text-slate-500 mt-0.5">{src.description}</p>
              </div>
            </label>
          ))}
        </div>
      </section>

      {/* Sectors */}
      <section className="bg-white border border-slate-200 rounded-md p-4 space-y-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Target Sectors</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Select sectors relevant to your advisory practice.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {availableSectors.map((sector) => {
            const isSelected = sectors.includes(sector);
            return (
              <label
                key={sector}
                className={`flex items-center gap-2 p-2 border rounded-md text-xs cursor-pointer transition-colors duration-100 ${
                  isSelected
                    ? 'border-slate-900 bg-slate-50 text-slate-900 font-medium'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleSector(sector)}
                  className="h-3.5 w-3.5 rounded border-slate-300 text-slate-900 focus:ring-1 focus:ring-blue-600"
                />
                <span>{sector}</span>
              </label>
            );
          })}
        </div>
      </section>

      {/* Regions */}
      <section className="bg-white border border-slate-200 rounded-md p-4 space-y-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Target Regions</h2>
          <p className="text-xs text-slate-500 mt-0.5">Geographical coverage for opportunities.</p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {availableRegions.map((region) => {
            const isSelected = regions.includes(region);
            return (
              <button
                key={region}
                type="button"
                onClick={() => toggleRegion(region)}
                className={`px-2.5 py-1 rounded text-xs transition-colors duration-100 border ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900 font-medium'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                }`}
              >
                {region}
              </button>
            );
          })}
        </div>
      </section>

      {/* Keywords */}
      <section className="bg-white border border-slate-200 rounded-md p-4 space-y-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Keywords</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Keywords used to weight fit scoring algorithms.
          </p>
        </div>

        <form onSubmit={handleAddKeyword} className="flex gap-2">
          <Input
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            placeholder="Add keyword (e.g. Enterprise Architecture)..."
          />
          <Button type="submit" variant="secondary" size="md">
            Add
          </Button>
        </form>

        <div className="flex flex-wrap gap-1.5 pt-1">
          {keywords.map((kw) => (
            <span
              key={kw}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-800 rounded text-xs"
            >
              <span>{kw}</span>
              <button
                type="button"
                aria-label={`Remove ${kw}`}
                onClick={() => handleRemoveKeyword(kw)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      </section>

      {/* Review Pack Notifications (Part B #7) */}
      <section className="bg-white border border-slate-200 rounded-md p-4 space-y-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Review Pack Notifications</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Automated digest options for the proposal review team.
          </p>
        </div>

        <label className="flex items-start gap-3 cursor-pointer text-xs">
          <input
            type="checkbox"
            checked={dailyDigest}
            onChange={(e) => setDailyDigest(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-1 focus:ring-blue-600"
          />
          <div>
            <span className="font-medium text-slate-900">Send daily shortlist digest email</span>
            <p className="text-slate-500 mt-0.5">
              Summarizes newly scored tenders, bid recommendations, and drafts ready for review at 08:00 AM.
            </p>
          </div>
        </label>
      </section>
    </div>
  );
};

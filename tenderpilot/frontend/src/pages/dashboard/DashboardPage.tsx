import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Home,
  ChevronRight,
  Gavel,
  AlertTriangle,
  FileClock,
  Send,
  Gauge,
  Inbox,
  BarChart3,
  CircleCheck,
  CircleAlert,
  Zap,
  Upload,
  UserPlus,
  FilePlus2,
  ClipboardList,
  Sliders,
  Compass,
  Target,
  CalendarDays,
  FileText,
  Trophy,
  Check,
  X,
} from 'lucide-react';
import { Badge, Button, Card, Modal, Select, Segmented } from '../../components/ui';
import {
  AreaChart,
  DotMeter,
  Heatmap,
  MeterBar,
  SparkBars,
  TrackBarChart,
} from '../../components/charts';
import { useApp } from '../../context/AppContext';
import type { PipelineStage, Tender } from '../../data/mockData';

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const STAGE_GROUPS: { label: string; stages: PipelineStage[] }[] = [
  { label: 'Found', stages: ['found', 'extracted'] },
  { label: 'Scored', stages: ['scored'] },
  { label: 'Matched', stages: ['matched'] },
  { label: 'Drafted', stages: ['drafted', 'checked'] },
  { label: 'In review', stages: ['review_sent'] },
  { label: 'Bid', stages: ['bid'] },
  { label: 'Submitted', stages: ['submitted_by_human'] },
  { label: 'No bid', stages: ['no_bid'] },
];

const DAY_MS = 86_400_000;
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const parseDate = (iso: string) => {
  const d = new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
};

const daysUntil = (iso: string) => {
  const d = parseDate(iso);
  if (!d) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - today.getTime()) / DAY_MS);
};

const shortDate = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

const isAwaiting = (t: Tender) =>
  !t.decision && (t.stage === 'scored' || t.stage === 'matched' || t.stage === 'found');

/* ------------------------------------------------------------------ */
/* Small presentational pieces                                         */
/* ------------------------------------------------------------------ */

const KpiCard: React.FC<{
  label: string;
  value: React.ReactNode;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
  spark: number[];
}> = ({ label, value, hint, icon: Icon, spark }) => (
  <div className="bg-white border border-slate-200 rounded-xl shadow-card p-4">
    <div className="flex items-start justify-between gap-3">
      <span className="text-[13px] text-slate-500">{label}</span>
      <span className="h-9 w-9 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 shrink-0">
        <Icon className="w-4 h-4" />
      </span>
    </div>
    <div className="mt-3 flex items-end justify-between gap-3">
      <div>
        <div className="text-2xl font-bold text-slate-900 tabular-nums leading-none">{value}</div>
        <div className="text-xs text-slate-500 mt-1.5">{hint}</div>
      </div>
      {spark.length > 2 && <SparkBars values={spark} />}
    </div>
  </div>
);

const StatChip: React.FC<{
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  tone: 'green' | 'red' | 'orange';
}> = ({ icon: Icon, label, value, tone }) => {
  const tones = {
    green: 'bg-emerald-500',
    red: 'bg-red-500',
    orange: 'bg-accent-500',
  };
  return (
    <div className="inline-flex items-center gap-2 h-9 pl-1 pr-3 bg-white border border-slate-200 rounded-lg text-xs text-slate-600">
      <span className={`h-7 w-7 rounded-md ${tones[tone]} text-white flex items-center justify-center`}>
        <Icon className="w-3.5 h-3.5" />
      </span>
      {label}
      <strong className="text-slate-900 tabular-nums">{value}</strong>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export const DashboardPage: React.FC = () => {
  const { tenders, proposals, recordDecision, recordOutcome } = useApp();
  const navigate = useNavigate();

  // Source filter (top-right toggle)
  const sources = useMemo(() => Array.from(new Set(tenders.map((t) => t.source))).slice(0, 3), [tenders]);
  const [source, setSource] = useState<string>('all');
  const scoped = useMemo(
    () => (source === 'all' ? tenders : tenders.filter((t) => t.source === source)),
    [tenders, source]
  );
  const scopedIds = new Set(scoped.map((t) => t.id));
  const scopedProposals = proposals.filter((p) => scopedIds.has(p.tenderId));

  // Outcome modal
  const [outcomeTender, setOutcomeTender] = useState<Tender | null>(null);
  const [outcomeType, setOutcomeType] = useState<'won' | 'lost'>('won');
  const [learningNote, setLearningNote] = useState('');

  // Core lists
  const awaitingDecision = scoped.filter(isAwaiting);
  const draftsAwaitingReview = scopedProposals.filter(
    (p) => p.status === 'Draft' || p.status === 'Under Review'
  );
  const activeSubmissions = scoped.filter((t) => t.stage === 'bid' || t.stage === 'review_sent');
  const flagsPending = draftsAwaitingReview.filter((p) => !p.checksAcknowledged).length;
  const upcomingTenders = [...scoped].sort((a, b) => a.deadline.localeCompare(b.deadline));
  const avgFit = scoped.length ? Math.round(scoped.reduce((s, t) => s + t.fitScore, 0) / scoped.length) : 0;
  const decided = scoped.filter((t) => t.decision || t.stage === 'no_bid' || t.stage === 'bid' || t.stage === 'submitted_by_human').length;

  // Pipeline chart
  const pipeline = STAGE_GROUPS.map((g) => ({
    label: g.label,
    value: scoped.filter((t) => g.stages.includes(t.stage)).length,
  }));
  const busiest = pipeline.reduce((best, d, i, arr) => (d.value > arr[best].value ? i : best), 0);

  // Per-source tiles
  const sourceTiles = Array.from(new Set(tenders.map((t) => t.source))).map((name) => {
    const list = tenders.filter((t) => t.source === name);
    const avg = Math.round(list.reduce((s, t) => s + t.fitScore, 0) / list.length);
    return { name, count: list.length, avg };
  });

  // Fit-score trend (tenders ordered by deadline)
  const fitTrend = upcomingTenders.map((t) => ({
    label: parseDate(t.deadline) ? shortDate(parseDate(t.deadline)!) : t.referenceNumber,
    value: t.fitScore,
  }));

  // Deadline heatmap: next 6 weeks, Mon–Sun
  const heat = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7)); // back to Monday
    const weeks = 6;
    const values = Array.from({ length: weeks }, () => Array(7).fill(0) as number[]);
    const titles: string[][] = Array.from({ length: weeks }, () => Array(7).fill(''));
    scoped.forEach((t) => {
      const d = parseDate(t.deadline);
      if (!d) return;
      const idx = Math.floor((d.getTime() - start.getTime()) / DAY_MS);
      if (idx < 0 || idx >= weeks * 7) return;
      const w = Math.floor(idx / 7);
      const day = idx % 7;
      values[w][day] += 1;
      titles[w][day] = titles[w][day] ? `${titles[w][day]}; ${t.title}` : t.title;
    });
    const rows = Array.from({ length: weeks }, (_, w) => `w/c ${shortDate(new Date(start.getTime() + w * 7 * DAY_MS))}`);
    return { rows, values, titles };
  }, [scoped]);

  // Proposal status distribution
  const statusDist = (['Draft', 'Under Review', 'Approved'] as const).map((s) => ({
    label: s,
    value: scopedProposals.filter((p) => p.status === s).length,
  }));
  const statusTotal = Math.max(1, statusDist.reduce((s, d) => s + d.value, 0));
  const statusColors = ['bg-accent-500', 'bg-deep-700', 'bg-emerald-500'];

  // Win / loss
  const won = tenders.filter((t) => t.outcome?.outcome === 'won').length;
  const lost = tenders.filter((t) => t.outcome?.outcome === 'lost').length;
  const tendersWithOutcome = tenders.filter((t) => t.outcome);
  const latestOutcome = tendersWithOutcome[0] || {
    title: 'WHO Regional Epidemiological Surveillance (Prior 2025 Submission)',
    outcome: {
      outcome: 'won',
      markedAt: '2026-10-15',
      learningNote:
        'Partner highlighted clear FHIR interoperability methodology and specific named consultant CVs as decisive differentiator over incumbent firm.',
    },
  };

  const handleSaveOutcome = (e: React.FormEvent) => {
    e.preventDefault();
    if (!outcomeTender) return;
    recordOutcome(outcomeTender.id, outcomeType, learningNote || 'Decision noted.');
    setOutcomeTender(null);
    setLearningNote('');
  };

  const quickActions = [
    { label: 'Upload TOR', icon: Upload, to: '/tenders' },
    { label: 'Add CV', icon: UserPlus, to: '/knowledge-base' },
    { label: 'New proposal', icon: FilePlus2, to: '/proposals' },
    { label: 'Browse tenders', icon: Compass, to: '/tenders' },
    { label: 'Audit trail', icon: ClipboardList, to: '/audit' },
    { label: 'Preferences', icon: Sliders, to: '/settings/preferences' },
  ];

  return (
    <div className="space-y-5">
      {/* ===== Header ===== */}
      <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Operational Overview</h1>
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
            <Link to="/" className="hover:text-slate-900" aria-label="Home">
              <Home className="w-3.5 h-3.5" />
            </Link>
            <ChevronRight className="w-3 h-3" />
            <span>Bid Desk</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-slate-900 font-medium">Dashboard</span>
          </nav>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatChip icon={Gavel} label="Awaiting decision" value={awaitingDecision.length} tone="orange" />
          <StatChip icon={AlertTriangle} label="Flags pending" value={flagsPending} tone="red" />
          <Segmented
            ariaLabel="Filter by source"
            value={source}
            onChange={setSource}
            options={[{ value: 'all', label: 'All sources' }, ...sources.map((s) => ({ value: s, label: s }))]}
          />
        </div>
      </div>

      {/* ===== KPI row ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          label="Awaiting decision"
          value={awaitingDecision.length}
          hint="Need a partner go / no-go"
          icon={Inbox}
          spark={awaitingDecision.map((t) => t.fitScore)}
        />
        <KpiCard
          label="Drafts in review"
          value={draftsAwaitingReview.length}
          hint={`${flagsPending} with unresolved flags`}
          icon={FileClock}
          spark={draftsAwaitingReview.map((p) => p.sections.length)}
        />
        <KpiCard
          label="Active submissions"
          value={activeSubmissions.length}
          hint="Bid or review pack sent"
          icon={Send}
          spark={pipeline.map((p) => p.value)}
        />
        <KpiCard
          label="Average fit score"
          value={<>{avgFit}<span className="text-sm font-medium text-slate-400">/100</span></>}
          hint={`Across ${scoped.length} tenders`}
          icon={Gauge}
          spark={scoped.map((t) => t.fitScore)}
        />
      </div>

      {/* ===== Pipeline + side column ===== */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card title="Pipeline by stage" icon={BarChart3} className="xl:col-span-2"
          actions={<span className="text-xs text-slate-500">{scoped.length} tenders</span>}>
          <TrackBarChart data={pipeline} highlightIndex={busiest} />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">
            {sourceTiles.map((s) => (
              <div key={s.name} className="rounded-lg bg-canvas border border-slate-200 p-3">
                <div className="text-xs text-slate-500 truncate">{s.name}</div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-sm font-semibold text-slate-900">
                    {s.count} tender{s.count === 1 ? '' : 's'} · fit {s.avg}
                  </span>
                  {s.avg >= 70 ? (
                    <CircleCheck className="w-4 h-4 text-emerald-500" aria-label="Good average fit" />
                  ) : (
                    <CircleAlert className="w-4 h-4 text-amber-500" aria-label="Low average fit" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-4">
          <Card title="Bid decisions recorded" icon={Target}>
            <div className="flex items-center justify-between text-sm mb-3">
              <span className="text-slate-500">
                {decided} of {scoped.length} tenders
              </span>
              <span className="font-bold text-slate-900 tabular-nums">
                {scoped.length ? Math.round((decided / scoped.length) * 100) : 0}%
              </span>
            </div>
            <DotMeter value={decided} total={scoped.length} />
          </Card>

          <Card title="Quick actions" icon={Zap}>
            <div className="grid grid-cols-3 gap-y-4 gap-x-2">
              {quickActions.map((a) => {
                const Icon = a.icon;
                return (
                  <button
                    key={a.label}
                    type="button"
                    onClick={() => navigate(a.to)}
                    className="group flex flex-col items-center gap-2 text-[11px] text-slate-600 hover:text-slate-900"
                  >
                    <span className="h-10 w-10 rounded-full bg-slate-900 text-white flex items-center justify-center group-hover:bg-accent-500 transition-colors">
                      <Icon className="w-4 h-4" />
                    </span>
                    {a.label}
                  </button>
                );
              })}
            </div>
          </Card>
        </div>
      </div>

      {/* ===== Go / no-go tiles + fit trend ===== */}
      <Card
        title={`Tenders awaiting go / no-go decision (${awaitingDecision.length})`}
        icon={Gavel}
        actions={
          <button onClick={() => navigate('/tenders')} className="text-xs font-medium text-accent-600 hover:underline">
            View all tenders →
          </button>
        }
      >
        {awaitingDecision.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {awaitingDecision.map((t) => {
              const left = daysUntil(t.deadline);
              return (
                <div key={t.id} className="rounded-lg border border-slate-200 p-3.5 flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[11px] text-slate-500 font-mono">{t.referenceNumber}</div>
                      <div className="text-sm font-semibold text-slate-900 leading-snug mt-0.5 line-clamp-2">{t.title}</div>
                      <div className="text-xs text-slate-500 mt-1">
                        {t.agency}
                        {left !== null && <> · {left >= 0 ? `${left} days left` : 'past deadline'}</>}
                      </div>
                    </div>
                    <Badge variant={t.recommendation === 'bid' ? 'success' : 'warning'}>
                      {t.recommendation === 'bid' ? 'BID' : 'NO BID'}
                    </Badge>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-slate-500">Fit score</span>
                      <span className="font-bold text-slate-900 tabular-nums">{t.fitScore}%</span>
                    </div>
                    <MeterBar value={t.fitScore} />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="primary" className="flex-1"
                      onClick={() => recordDecision(t.id, 'bid', 'Approved on dashboard.')}>
                      <Check className="w-3.5 h-3.5" /> Approve bid
                    </Button>
                    <Button size="sm" variant="secondary" className="flex-1"
                      onClick={() => recordDecision(t.id, 'no_bid', 'Declined on dashboard.')}>
                      <X className="w-3.5 h-3.5" /> Decline
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-slate-500">All scored opportunities have human decisions recorded.</p>
        )}

        {fitTrend.length > 1 && (
          <div className="mt-6">
            <div className="text-sm font-semibold text-slate-900 mb-2">Fit score by deadline</div>
            <AreaChart data={fitTrend} />
          </div>
        )}
      </Card>

      {/* ===== Bottom row ===== */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="space-y-4">
          <Card title="Upcoming submission deadlines" icon={CalendarDays} bodyClassName="divide-y divide-slate-100">
            {upcomingTenders.slice(0, 4).map((t) => {
              const left = daysUntil(t.deadline);
              return (
                <div key={t.id} className="px-4 py-3 flex items-center justify-between gap-3 text-xs">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-slate-900 truncate">{t.title}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Deadline <strong className="text-slate-700">{t.deadline}</strong> · {t.agency}
                    </div>
                  </div>
                  {left !== null && left >= 0 && left <= 14 && !t.outcome && (
                    <span className="text-[11px] font-medium text-accent-600 whitespace-nowrap">{left}d</span>
                  )}
                  {t.outcome ? (
                    <Badge variant={t.outcome.outcome === 'won' ? 'success' : 'neutral'}>
                      {t.outcome.outcome.toUpperCase()}
                    </Badge>
                  ) : (
                    <button type="button" onClick={() => setOutcomeTender(t)}
                      className="text-xs font-medium text-accent-600 hover:underline px-2 py-1 whitespace-nowrap">
                      Log outcome
                    </button>
                  )}
                </div>
              );
            })}
          </Card>

          <Card title="Win / loss" icon={Trophy}>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { n: won, label: 'Won', bar: 'border-emerald-500' },
                { n: lost, label: 'Lost', bar: 'border-red-500' },
                { n: tenders.length - won - lost, label: 'No outcome yet', bar: 'border-amber-400' },
              ].map((s) => (
                <div key={s.label} className={`border-l-[3px] ${s.bar} pl-3`}>
                  <div className="text-2xl font-bold text-slate-900 tabular-nums">{s.n}</div>
                  <div className="text-[11px] text-slate-500">{s.label}</div>
                </div>
              ))}
            </div>
            <div className="rounded-lg bg-canvas border border-slate-200 p-3 text-xs">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="font-semibold text-slate-800 truncate">Debrief · {latestOutcome.title}</span>
                <Badge variant={latestOutcome.outcome?.outcome === 'won' ? 'success' : 'neutral'}>
                  {latestOutcome.outcome?.outcome.toUpperCase()}
                </Badge>
              </div>
              <p className="text-slate-600 leading-relaxed">{latestOutcome.outcome?.learningNote}</p>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card title={`Proposals in review (${draftsAwaitingReview.length})`} icon={FileText}
            actions={
              <button onClick={() => navigate('/proposals')} className="text-xs font-medium text-accent-600 hover:underline">
                Open studio →
              </button>
            }>
            <div className="flex h-3 rounded-full overflow-hidden bg-slate-100" aria-hidden="true">
              {statusDist.map((d, i) => (
                <span key={d.label} className={statusColors[i]} style={{ width: `${(d.value / statusTotal) * 100}%` }} />
              ))}
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-1 mt-2 text-[11px] text-slate-500">
              {statusDist.map((d, i) => (
                <span key={d.label} className="inline-flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full ${statusColors[i]}`} />
                  {d.label} <strong className="text-slate-800">{d.value}</strong>
                </span>
              ))}
            </div>
            <div className="mt-4 divide-y divide-slate-100 border-t border-slate-100">
              {draftsAwaitingReview.map((p) => (
                <div key={p.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-slate-900 truncate">{p.tenderTitle}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {p.agency} · {p.sections.length} sections · {p.team.length} experts
                    </div>
                  </div>
                  <Badge variant={p.checksAcknowledged ? 'success' : 'warning'}>
                    {p.checksAcknowledged ? 'Checks OK' : 'Flags pending'}
                  </Badge>
                  <Button size="sm" variant="secondary" onClick={() => navigate('/proposals')}>
                    Review
                  </Button>
                </div>
              ))}
              {draftsAwaitingReview.length === 0 && (
                <p className="py-3 text-xs text-slate-500">No drafts waiting for review.</p>
              )}
            </div>
          </Card>

          <Card title="Deadline calendar (next 6 weeks)" icon={CalendarDays}>
            <Heatmap
              rows={heat.rows}
              columns={WEEKDAYS}
              values={heat.values}
              cellTitle={(r, c, v) => (v ? `${v} deadline${v > 1 ? 's' : ''}: ${heat.titles[r][c]}` : 'No deadlines')}
            />
          </Card>
        </div>
      </div>

      {/* Win/Loss outcome modal */}
      {outcomeTender && (
        <Modal
          isOpen={Boolean(outcomeTender)}
          onClose={() => setOutcomeTender(null)}
          title={`Record Outcome: ${outcomeTender.title}`}
          description="Log winning or losing debrief notes to improve future proposal scoring."
        >
          <form onSubmit={handleSaveOutcome} className="space-y-3 text-xs">
            <Select
              label="Bid outcome"
              value={outcomeType}
              onChange={(e) => setOutcomeType(e.target.value as 'won' | 'lost')}
              options={[
                { value: 'won', label: 'Won / Awarded Contract' },
                { value: 'lost', label: 'Lost / Not Awarded' },
              ]}
            />
            <div>
              <label className="block font-medium text-slate-700 mb-1">Debrief notes ("What we learned")</label>
              <textarea
                rows={3}
                required
                value={learningNote}
                onChange={(e) => setLearningNote(e.target.value)}
                placeholder="e.g. Donor debrief cited strong staffing matrix but requested lower senior daily billing rates..."
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-accent-100 focus:border-accent-500"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button type="button" variant="secondary" onClick={() => setOutcomeTender(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Save outcome
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

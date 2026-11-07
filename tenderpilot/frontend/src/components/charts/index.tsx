import React from 'react';

/* Small, dependency-free charts used on the dashboard. All are pure CSS/SVG. */

/** Tiny bar sparkline for KPI cards. The last bar (or `highlight`) is drawn in the accent colour. */
export const SparkBars: React.FC<{ values: number[]; highlight?: number; className?: string }> = ({
  values,
  highlight = values.length - 1,
  className = '',
}) => {
  const max = Math.max(1, ...values);
  return (
    <div className={`flex items-end gap-[3px] h-10 ${className}`} aria-hidden="true">
      {values.map((v, i) => (
        <span
          key={i}
          className={`w-[5px] rounded-sm ${i === highlight ? 'bg-accent-500' : 'bg-accent-200'}`}
          style={{ height: `${Math.max(8, (v / max) * 100)}%` }}
        />
      ))}
    </div>
  );
};

export interface BarDatum {
  label: string;
  value: number;
}

/** Vertical bar chart with grey "track" behind each bar, value printed inside the bar. */
export const TrackBarChart: React.FC<{
  data: BarDatum[];
  highlightIndex?: number;
  unit?: string;
  height?: number;
}> = ({ data, highlightIndex, unit = '', height = 200 }) => {
  // Round the axis up to a multiple of 4 so the 5 tick labels are distinct whole numbers
  const max = Math.max(4, Math.ceil(Math.max(...data.map((d) => d.value), 0) / 4) * 4);
  const ticks = [1, 0.75, 0.5, 0.25, 0].map((t) => max * t);
  return (
    <div className="flex gap-3" role="img" aria-label={data.map((d) => `${d.label}: ${d.value}${unit}`).join(', ')}>
      <div className="flex flex-col justify-between text-[11px] text-slate-400 tabular-nums pb-6" style={{ height }}>
        {ticks.map((t, i) => (
          <span key={i}>{t}</span>
        ))}
      </div>
      <div className="flex-1 grid gap-3 sm:gap-5" style={{ gridTemplateColumns: `repeat(${data.length}, minmax(0, 1fr))` }}>
        {data.map((d, i) => {
          const pct = d.value === 0 ? 0 : Math.max(14, (d.value / max) * 100);
          const hot = i === highlightIndex;
          return (
            <div key={d.label} className="flex flex-col items-center gap-2 min-w-0">
              <div className="relative w-full max-w-[64px] rounded-lg bg-slate-100" style={{ height: height - 24 }}>
                {pct > 0 && (
                  <div
                    className={`absolute inset-x-0 bottom-0 rounded-lg flex items-end justify-center pb-2 text-[11px] font-semibold text-white ${
                      hot ? 'bg-accent-500' : 'bg-deep-700'
                    }`}
                    style={{ height: `${pct}%` }}
                  >
                    {d.value}
                    {unit}
                  </div>
                )}
              </div>
              <span className="text-[11px] text-slate-500 truncate w-full text-center">{d.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/** Row of dots filled up to `value / total` (e.g. "9 of 12 decided"). */
export const DotMeter: React.FC<{ value: number; total: number; dots?: number }> = ({ value, total, dots = 14 }) => {
  const filled = total === 0 ? 0 : Math.round((value / total) * dots);
  return (
    <div className="flex flex-wrap gap-1.5" aria-hidden="true">
      {Array.from({ length: dots }, (_, i) => (
        <span key={i} className={`h-3.5 w-3.5 rounded-full ${i < filled ? 'bg-accent-500' : 'bg-slate-200'}`} />
      ))}
    </div>
  );
};

/** Thin horizontal progress bar coloured by thresholds. */
export const MeterBar: React.FC<{ value: number }> = ({ value }) => {
  const color = value >= 75 ? 'bg-emerald-500' : value >= 55 ? 'bg-amber-400' : 'bg-red-500';
  return (
    <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
};

/** Smooth area chart (SVG). */
export const AreaChart: React.FC<{ data: BarDatum[]; height?: number }> = ({ data, height = 180 }) => {
  if (data.length < 2) return null;
  // Wide viewBox so the chart fills a full-width card without being letterboxed
  const W = 1000;
  const H = height;
  const padB = 22;
  const max = Math.max(1, ...data.map((d) => d.value)) * 1.15;
  const x = (i: number) => (i / (data.length - 1)) * W;
  const y = (v: number) => H - padB - (v / max) * (H - padB - 8);
  // Catmull-Rom → cubic Bézier for a smooth line
  const pts = data.map((d, i) => [x(i), y(d.value)] as const);
  let path = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    path += ` C ${c1[0]} ${c1[1]}, ${c2[0]} ${c2[1]}, ${p2[0]} ${p2[1]}`;
  }
  const area = `${path} L ${W} ${H - padB} L 0 ${H - padB} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height }} role="img"
      aria-label={data.map((d) => `${d.label}: ${d.value}`).join(', ')}>
      <defs>
        <linearGradient id="areaFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#f26522" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#f26522" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((t) => (
        <line key={t} x1="0" x2={W} y1={(H - padB) * t} y2={(H - padB) * t} stroke="#eef0f3" />
      ))}
      <path d={area} fill="url(#areaFill)" />
      <path d={path} fill="none" stroke="#f26522" strokeWidth="2" />
      {pts.map(([px, py], i) => (
        <circle key={i} cx={px} cy={py} r="3" fill="#fff" stroke="#f26522" strokeWidth="1.5" />
      ))}
      {data.map((d, i) => (
        <text key={`${i}-${d.label}`} x={x(i)} y={H - 4} fontSize="11" fill="#94a3b8"
          textAnchor={i === 0 ? 'start' : i === data.length - 1 ? 'end' : 'middle'}>
          {d.label}
        </text>
      ))}
    </svg>
  );
};

/** Grid heatmap: rows × columns of counts, coloured by intensity. */
export const Heatmap: React.FC<{
  rows: string[];
  columns: string[];
  values: number[][];
  cellTitle?: (row: number, col: number, value: number) => string;
}> = ({ rows, columns, values, cellTitle }) => {
  const max = Math.max(1, ...values.flat());
  const shade = (v: number) => {
    if (v === 0) return 'bg-slate-100';
    const r = v / max;
    if (r > 0.75) return 'bg-accent-500';
    if (r > 0.5) return 'bg-accent-400';
    if (r > 0.25) return 'bg-accent-200';
    return 'bg-accent-100';
  };
  return (
    <div className="overflow-x-auto">
      <table className="border-separate border-spacing-1 text-[11px] text-slate-400">
        <thead>
          <tr>
            <th />
            {columns.map((c) => (
              <th key={c} className="font-normal px-0.5">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => (
            <tr key={r}>
              <th className="font-normal text-left pr-2 whitespace-nowrap">{r}</th>
              {columns.map((c, ci) => {
                const v = values[ri]?.[ci] ?? 0;
                return (
                  <td key={c} title={cellTitle?.(ri, ci, v)}
                    className={`h-6 w-6 min-w-[1.5rem] rounded ${shade(v)}`} />
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

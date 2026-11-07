export interface SegmentedProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  size?: 'xs' | 'sm';
  /** 'accent' = orange active pill, 'dark' = teal active pill */
  tone?: 'accent' | 'dark';
  ariaLabel?: string;
}

/** Compact pill toggle (e.g. "All | UNGM | World Bank" or "1W | 1M"). */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  size = 'sm',
  tone = 'accent',
  ariaLabel,
}: SegmentedProps<T>) {
  const pad = size === 'xs' ? 'h-6 px-2 text-[11px]' : 'h-8 px-3 text-xs';
  const active = tone === 'accent' ? 'bg-accent-500 text-white' : 'bg-deep-700 text-white';
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="inline-flex items-center gap-0.5 p-0.5 bg-white border border-slate-200 rounded-lg"
    >
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={o.value === value}
          onClick={() => onChange(o.value)}
          className={`${pad} rounded-md font-medium transition-colors whitespace-nowrap ${
            o.value === value ? active : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

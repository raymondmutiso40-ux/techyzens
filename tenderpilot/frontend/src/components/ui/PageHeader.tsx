import React from 'react';

export interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
  category?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  children,
  category,
}) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-200">
    <div>
      {category && (
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-0.5">
          {category}
        </span>
      )}
      <h1 className="text-xl font-semibold text-slate-900 tracking-tight">{title}</h1>
      {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
    </div>
    {children && <div className="flex items-center gap-2 shrink-0">{children}</div>}
  </div>
);

import React from 'react';

export interface CardProps {
  title?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  actions?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  children: React.ReactNode;
}

/** White dashboard panel with an optional icon + title header row. */
export const Card: React.FC<CardProps> = ({
  title,
  icon: Icon,
  actions,
  className = '',
  bodyClassName = 'p-4',
  children,
}) => (
  <section className={`bg-white border border-slate-200 rounded-xl shadow-card ${className}`}>
    {(title || actions) && (
      <header className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-100">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          {Icon && <Icon className="w-4 h-4 text-accent-500" />}
          {title}
        </h2>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </header>
    )}
    <div className={bodyClassName}>{children}</div>
  </section>
);

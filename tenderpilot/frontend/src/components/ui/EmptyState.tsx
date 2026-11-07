import React from 'react';

export interface EmptyStateProps {
  title: string;
  description: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ title, description, action }) => (
  <div className="py-12 px-4 text-center border border-dashed border-slate-200 rounded-md bg-white">
    <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">{description}</p>
    {action && <div className="mt-3">{action}</div>}
  </div>
);

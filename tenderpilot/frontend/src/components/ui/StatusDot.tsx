import React from 'react';

export interface StatusDotProps {
  status: 'green' | 'amber' | 'red' | 'gray';
  label?: string;
  className?: string;
}

export const StatusDot: React.FC<StatusDotProps> = ({ status, label, className = '' }) => {
  const dots = {
    green: 'bg-emerald-500',
    amber: 'bg-amber-500',
    red: 'bg-red-500',
    gray: 'bg-slate-400',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs text-slate-700 ${className}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dots[status]} shrink-0`} />
      {label && <span>{label}</span>}
    </span>
  );
};

import React from 'react';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onChange, className = '' }) => {
  return (
    <div className={`flex border-b border-slate-200 gap-6 text-sm ${className}`}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`pb-2.5 font-medium border-b-2 -mb-px transition-colors duration-150 text-xs sm:text-sm flex items-center gap-1.5 ${
              isActive
                ? 'border-blue-600 text-slate-900 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <span>{tab.label}</span>
            {typeof tab.count === 'number' && (
              <span
                className={`text-[11px] px-1.5 py-0.2 rounded font-normal ${
                  isActive ? 'bg-slate-100 text-slate-800' : 'text-slate-400'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

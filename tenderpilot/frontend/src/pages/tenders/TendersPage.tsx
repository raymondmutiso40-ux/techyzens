import React from 'react';
import { Compass, Sparkles } from 'lucide-react';

export const TendersPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-600 text-sm font-semibold tracking-wide uppercase">
            <Compass className="w-4 h-4" />
            <span>Opportunity Pipeline</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mt-1">
            Tender Discovery
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            AI-monitored tenders ranked with fit scores against your firm's capability profile.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-dashed border-slate-300 p-8 text-center">
        <div className="h-12 w-12 rounded-xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center mb-3">
          <Sparkles className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-slate-900">Bundle B Work Area: Tender Discovery & Fit Analysis</h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
          This route (<code className="text-xs bg-slate-100 px-1 py-0.5 rounded">/tenders</code>) is ready for Bundle B.
          Filter bar, fit score badges, tender list cards, and detail modal/page can be plugged in here.
        </p>
      </div>
    </div>
  );
};

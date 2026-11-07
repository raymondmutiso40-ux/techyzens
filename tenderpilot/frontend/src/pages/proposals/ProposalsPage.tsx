import React from 'react';
import { FileText, Wand2 } from 'lucide-react';

export const ProposalsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center space-x-2 text-indigo-600 text-sm font-semibold tracking-wide uppercase">
          <FileText className="w-4 h-4" />
          <span>Technical Submissions</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mt-1">
          Proposals Studio
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          AI-generated technical proposal drafts grounded in your firm's real capability records.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-dashed border-slate-300 p-8 text-center">
        <div className="h-12 w-12 rounded-xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center mb-3">
          <Wand2 className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-slate-900">Bundle C Work Area: Proposal Studio & Export</h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
          This route (<code className="text-xs bg-slate-100 px-1 py-0.5 rounded">/proposals</code>) is ready for Bundle C.
          Drafting editor, citations grounder, and PDF/Word export controls can be built here.
        </p>
      </div>
    </div>
  );
};

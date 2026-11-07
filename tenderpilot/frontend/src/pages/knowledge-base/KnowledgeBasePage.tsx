import React from 'react';
import { Database, UploadCloud } from 'lucide-react';

export const KnowledgeBasePage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center space-x-2 text-indigo-600 text-sm font-semibold tracking-wide uppercase">
          <Database className="w-4 h-4" />
          <span>Firm Repository</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mt-1">
          Knowledge Base: CVs & Proposals
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Upload and index your firm's consultant CVs, past proposals, and capability statements.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-dashed border-slate-300 p-8 text-center">
        <div className="h-12 w-12 rounded-xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center mb-3">
          <UploadCloud className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-slate-900">Bundle A Work Area: Knowledge Base</h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
          This route (<code className="text-xs bg-slate-100 px-1 py-0.5 rounded">/knowledge-base</code>) is ready for Bundle A.
          Drag-and-drop document upload, file parser status, and consultant profile previews can be built here.
        </p>
      </div>
    </div>
  );
};

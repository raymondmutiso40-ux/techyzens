import React, { useId, useRef, useState } from 'react';
import { FileText, UploadCloud, X } from 'lucide-react';

export interface FileDropzoneProps {
  file: File | null;
  onFileChange: (file: File | null) => void;
  accept?: string;
  hint?: string;
  label?: string;
  error?: string | null;
  disabled?: boolean;
}

const formatBytes = (n: number) =>
  n < 1024 ? `${n} B` : n < 1024 * 1024 ? `${Math.round(n / 1024)} KB` : `${(n / (1024 * 1024)).toFixed(1)} MB`;

/** Click-or-drag file picker that shows the chosen file. */
export const FileDropzone: React.FC<FileDropzoneProps> = ({
  file,
  onFileChange,
  accept,
  hint = 'PDF, Word (.docx), .txt or .md · up to 15 MB',
  label = 'File',
  error,
  disabled,
}) => {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const pick = (files: FileList | null) => {
    if (disabled) return;
    onFileChange(files && files.length > 0 ? files[0] : null);
  };

  return (
    <div className="space-y-1">
      <label htmlFor={inputId} className="block text-xs font-medium text-slate-700">
        {label}
      </label>
      {file ? (
        <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 bg-canvas">
          <span className="h-9 w-9 rounded-lg bg-accent-50 text-accent-600 flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-slate-900 truncate">{file.name}</div>
            <div className="text-[11px] text-slate-500">{formatBytes(file.size)}</div>
          </div>
          <button
            type="button"
            onClick={() => {
              onFileChange(null);
              if (inputRef.current) inputRef.current.value = '';
            }}
            disabled={disabled}
            aria-label="Remove selected file"
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-white disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            pick(e.dataTransfer.files);
          }}
          onClick={() => inputRef.current?.click()}
          className={`flex flex-col items-center justify-center gap-1.5 px-4 py-6 rounded-lg border-2 border-dashed cursor-pointer text-center transition-colors ${
            error
              ? 'border-red-300 bg-red-50/40'
              : dragging
                ? 'border-accent-400 bg-accent-50'
                : 'border-slate-300 hover:border-accent-400 hover:bg-accent-50/40'
          }`}
        >
          <UploadCloud className="w-6 h-6 text-accent-500" />
          <div className="text-sm text-slate-700">
            <span className="font-semibold text-accent-600">Choose a file</span> or drag it here
          </div>
          <div className="text-[11px] text-slate-500">{hint}</div>
        </div>
      )}
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={accept}
        disabled={disabled}
        className="sr-only"
        onChange={(e) => pick(e.target.files)}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
};

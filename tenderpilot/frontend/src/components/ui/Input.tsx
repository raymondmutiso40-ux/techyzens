import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helper,
  id,
  className = '',
  ...props
}) => {
  const inputId = id || props.name;

  return (
    <div className="w-full space-y-1">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-medium text-slate-700">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full h-9 px-3 bg-white border rounded-md text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-accent-100 focus:border-accent-500 transition-colors duration-150 ${
          error ? 'border-red-400' : 'border-slate-300 hover:border-slate-400'
        } ${className}`}
        {...props}
      />
      {helper && !error && <p className="text-xs text-slate-500">{helper}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
};

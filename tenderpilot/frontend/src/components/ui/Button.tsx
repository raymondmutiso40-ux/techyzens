import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md';
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'secondary',
  size = 'md',
  className = '',
  disabled,
  children,
  ...props
}) => {
  const base =
    'inline-flex items-center justify-center font-medium rounded-md transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-accent-200 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap';

  const sizes = {
    sm: 'h-8 px-2.5 text-xs gap-1.5',
    md: 'h-9 px-3.5 text-sm gap-2',
  };

  const variants = {
    primary:
      'bg-accent-500 text-white hover:bg-accent-600 active:bg-accent-700 border border-transparent shadow-none',
    secondary:
      'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 active:bg-slate-100',
    danger:
      'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 border border-transparent',
    ghost:
      'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent',
  };

  return (
    <button
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

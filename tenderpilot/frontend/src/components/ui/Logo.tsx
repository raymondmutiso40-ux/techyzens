import React, { useState } from 'react';

export interface LogoProps {
  variant?: 'mark' | 'full';
  theme?: 'light' | 'dark'; // 'light' is for light backgrounds, 'dark' is for dark backgrounds
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showTagline?: boolean;
}

export const LogoMark: React.FC<{
  size?: 'sm' | 'md' | 'lg';
  theme?: 'light' | 'dark';
  className?: string;
}> = ({ size = 'md', theme = 'light', className = '' }) => {
  const [imgError, setImgError] = useState(false);

  const dimensionClasses = {
    sm: 'h-6 w-auto max-w-[28px]',
    md: 'h-7 w-auto max-w-[34px]',
    lg: 'h-9 w-auto max-w-[44px]',
  }[size];

  const iconSrc = theme === 'dark' ? '/tenderpilot-icon-dark.png' : '/tenderpilot-icon-light.png';

  if (imgError) {
    return (
      <div
        className={`flex items-center justify-center rounded font-semibold text-xs shrink-0 select-none ${
          theme === 'dark'
            ? 'bg-slate-900 text-white border border-slate-700'
            : 'bg-slate-900 text-white border border-slate-800'
        } ${size === 'sm' ? 'w-6 h-6 text-[10px]' : size === 'lg' ? 'w-9 h-9 text-sm' : 'w-7 h-7 text-xs'} ${className}`}
      >
        <span className="text-white">T</span>
        <span className="text-cyan-400">P</span>
      </div>
    );
  }

  return (
    <img
      src={iconSrc}
      alt="TenderPilot"
      className={`object-contain shrink-0 ${dimensionClasses} ${className}`}
      onError={() => setImgError(true)}
    />
  );
};

export const Logo: React.FC<LogoProps> = ({
  variant = 'full',
  theme = 'light',
  size = 'md',
  className = '',
  showTagline = false,
}) => {
  const [imgError, setImgError] = useState(false);

  const fullHeightClasses = {
    sm: 'h-5',
    md: 'h-6',
    lg: 'h-8',
  }[size];

  const logoSrc = theme === 'dark' ? '/tenderpilot-logo-dark.png' : '/tenderpilot-logo-light.png';

  if (variant === 'mark') {
    return <LogoMark size={size} theme={theme} className={className} />;
  }

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      {!imgError ? (
        <img
          src={logoSrc}
          alt="TenderPilot - Find. Score. Draft. Win."
          className={`object-contain w-auto ${fullHeightClasses}`}
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="flex items-center gap-2">
          <LogoMark size={size} theme={theme} />
          <div>
            <div
              className={`font-semibold tracking-tight leading-none ${
                size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm'
              } ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}
            >
              Tender<span className="text-cyan-600">Pilot</span>
            </div>
            {showTagline && (
              <div
                className={`text-[10px] tracking-tight mt-0.5 ${
                  theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                Find. Score. Draft. Win.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

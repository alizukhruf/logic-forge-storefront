import React from 'react';

interface LoaderProps {
  label?: string;
  variant?: 'inline' | 'screen';
}

export const Loader: React.FC<LoaderProps> = ({ label, variant = 'inline' }) => {
  if (variant === 'screen') {
    return (
      <div className="lf-loader-screen" role="status" aria-live="polite" aria-busy="true">
        <div className="lf-loader-brand" role="img" aria-label="Logic Forge logo">
          <span className="lf-loader-mark" aria-hidden="true">
            <span className="lf-loader-mark-letter">L</span>
          </span>
          <span className="lf-loader-wordmark" aria-hidden="true">
            <span className="lf-loader-word" aria-hidden="true">
              {'LOGIC'.split('').map((letter, index) => (
                <span key={`logic-${index}`} className="lf-loader-letter" style={{ animationDelay: `${0.8 + index * 0.055}s` }}>
                  {letter}
                </span>
              ))}
            </span>
            <span className="lf-loader-word lf-loader-word-accent" aria-hidden="true">
              {'FORGE'.split('').map((letter, index) => (
                <span key={`forge-${index}`} className="lf-loader-letter" style={{ animationDelay: `${1.1 + index * 0.055}s` }}>
                  {letter}
                </span>
              ))}
            </span>
          </span>
        </div>
        <div className="lf-loader-progress" aria-hidden="true">
          <span className="lf-loader-progress-dot" />
          <span className="lf-loader-progress-dot" />
          <span className="lf-loader-progress-dot" />
        </div>
        <p className="lf-loader-label">{label ?? 'Preparing your store...'}</p>
      </div>
    );
  }

  return (
    <div className="flex h-[60vh] flex-col items-center justify-center gap-4" role="status" aria-live="polite">
      <span className="h-10 w-10 animate-spin rounded-full border-4 border-brand-100 border-t-brand-600" aria-hidden="true" />
      <p className="text-sm text-gray-500">{label ?? 'Loading store…'}</p>
    </div>
  );
};

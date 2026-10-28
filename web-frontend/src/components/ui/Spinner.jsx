import React from 'react';

/**
 * Aurent Vector Brand Emblem.
 * Razor-sharp SVG emblem based on the official Aurent brand mark.
 * Works completely offline without depending on external asset loading.
 */
export function AurentBrandEmblem({ className = '', withShadow = true }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} ${withShadow ? 'drop-shadow-sm' : ''}`}
      aria-hidden="true"
    >
      <rect width="64" height="64" rx="16" fill="#10B981" />
      {/* Official Aurent Stylized 'A' */}
      <path
        fill="#FFFFFF"
        d="M18 48L28.5 16h7L46 48h-7.2l-1.8-6.2H27l-1.8 6.2H18zm10.4-12.2h7.2L32 24.5l-3.6 11.3z"
      />
      {/* Cashier / POS Integrated Terminal Badge */}
      <rect x="36" y="34" width="12" height="10" rx="1.5" fill="#065F46" />
      <rect x="38.5" y="30" width="7" height="5" rx="1" fill="#065F46" />
    </svg>
  );
}

const SIZE_CONFIG = {
  xs: {
    container: 'w-4 h-4',
    svg: 'w-4 h-4',
    strokeWidth: 2.75,
    hasLogo: false,
    microCore: 'w-1 h-1',
  },
  sm: {
    container: 'w-5 h-5',
    svg: 'w-5 h-5',
    strokeWidth: 2.5,
    hasLogo: false,
    microCore: 'w-1.5 h-1.5',
  },
  md: {
    container: 'w-8 h-8',
    svg: 'w-8 h-8',
    strokeWidth: 2.25,
    hasLogo: true,
    logoBox: 'w-4 h-4 rounded-md',
  },
  lg: {
    container: 'w-12 h-12',
    svg: 'w-12 h-12',
    strokeWidth: 2,
    hasLogo: true,
    logoBox: 'w-6 h-6 rounded-lg',
  },
  xl: {
    container: 'w-16 h-16',
    svg: 'w-16 h-16',
    strokeWidth: 1.85,
    hasLogo: true,
    logoBox: 'w-8 h-8 rounded-xl',
  },
  '2xl': {
    container: 'w-24 h-24',
    svg: 'w-24 h-24',
    strokeWidth: 1.75,
    hasLogo: true,
    logoBox: 'w-12 h-12 rounded-2xl',
  },
};

const VARIANT_CONFIG = {
  emerald: {
    text: 'text-emerald-500 dark:text-emerald-400',
    ring: 'stroke-emerald-500 dark:stroke-emerald-400',
    glow: 'drop-shadow-[0_0_8px_rgba(16,185,129,0.35)]',
  },
  white: {
    text: 'text-white',
    ring: 'stroke-white',
    glow: 'drop-shadow-[0_0_8px_rgba(255,255,255,0.35)]',
  },
  slate: {
    text: 'text-slate-600 dark:text-slate-400',
    ring: 'stroke-slate-600 dark:stroke-slate-400',
    glow: '',
  },
  amber: {
    text: 'text-amber-500 dark:text-amber-400',
    ring: 'stroke-amber-500 dark:stroke-amber-400',
    glow: 'drop-shadow-[0_0_8px_rgba(245,158,11,0.35)]',
  },
};

/**
 * Aurent Halo Orbit Spinner (G'oya 1).
 * Features:
 * - Center: Official Aurent brand logo/emblem gently pulsing with life.
 * - Orbit: Ultra-smooth rotating halo ring with rounded caps and soft brand glow.
 * - Adaptive: Switches to micro-core on small buttons (xs, sm) for zero layout clutter.
 * - Full accessibility and dark mode support.
 */
export default function Spinner({
  size = 'md',
  variant = 'emerald',
  className = '',
  label = 'Yuklanmoqda…',
  text = null,
  showLogo = true,
  fullScreen = false,
  overlay = false,
}) {
  const cfg = SIZE_CONFIG[size] || SIZE_CONFIG.md;
  const vCfg = VARIANT_CONFIG[variant] || VARIANT_CONFIG.emerald;
  const displayLogo = showLogo && cfg.hasLogo;

  const spinnerMarkup = (
    <div
      role="status"
      aria-label={label}
      className={`inline-flex flex-col items-center justify-center gap-3 ${vCfg.text} ${className}`}
    >
      <div className={`relative inline-flex items-center justify-center shrink-0 ${cfg.container}`}>
        {/* Outer Rotating Halo Orbit Ring */}
        <svg
          className={`animate-spin ${cfg.svg} ${vCfg.glow}`}
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Subtle background track */}
          <circle
            cx="16"
            cy="16"
            r="13"
            stroke="currentColor"
            strokeWidth={cfg.strokeWidth}
            className="opacity-15 dark:opacity-20"
          />
          {/* Smooth rotating arc with rounded ends */}
          <circle
            cx="16"
            cy="16"
            r="13"
            stroke="currentColor"
            strokeWidth={cfg.strokeWidth}
            strokeLinecap="round"
            strokeDasharray="48 78"
            className="opacity-95"
          />
        </svg>

        {/* Central Aurent Emblem (Halo Orbit center) */}
        {displayLogo ? (
          <div
            className={`absolute flex items-center justify-center overflow-hidden transition-transform animate-pulse ${cfg.logoBox}`}
            style={{ animationDuration: '1.6s' }}
          >
            <AurentBrandEmblem className="w-full h-full" />
          </div>
        ) : (
          /* Micro core for small sizes (buttons/inline) */
          <span
            className={`absolute rounded-full bg-current animate-pulse pointer-events-none ${cfg.microCore}`}
            style={{ animationDuration: '1.2s' }}
          />
        )}
      </div>

      {text && (
        <span className="text-xs font-medium text-slate-600 dark:text-slate-300 tracking-normal select-none text-center animate-pulse">
          {text}
        </span>
      )}

      <span className="sr-only">{label}</span>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-slate-950/85 backdrop-blur-sm transition-all duration-300">
        <div className="p-6 rounded-3xl bg-white/60 dark:bg-slate-900/60 shadow-2xl border border-slate-200/50 dark:border-slate-800/60 flex flex-col items-center">
          {spinnerMarkup}
        </div>
      </div>
    );
  }

  if (overlay) {
    return (
      <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/70 dark:bg-slate-900/70 backdrop-blur-xs rounded-[inherit] transition-all">
        {spinnerMarkup}
      </div>
    );
  }

  return spinnerMarkup;
}

export { Spinner as AurentSpinner };

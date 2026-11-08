import React from 'react';

export default function DonutGauge({
  label,
  valueText,
  greenLabel,
  redLabel,
  ring,
  ariaLabel,
}) {
  return (
    <div className="flex items-center gap-4">
      <svg
        width="88"
        height="88"
        viewBox="0 0 96 96"
        role="img"
        aria-label={ariaLabel}
        className="shrink-0"
      >
        <circle cx="48" cy="48" r="38" fill="none" stroke="#E2E8F0" strokeWidth="10" className="dark:stroke-slate-800" />
        <circle
          cx="48"
          cy="48"
          r="38"
          fill="none"
          stroke="#EF4444"
          strokeWidth="10"
          strokeDasharray={ring.rDash}
          strokeDashoffset={ring.rOff}
          transform="rotate(-90 48 48)"
        />
        <circle
          cx="48"
          cy="48"
          r="38"
          fill="none"
          stroke="#0E7C4F"
          strokeWidth="10"
          strokeDasharray={ring.gDash}
          transform="rotate(-90 48 48)"
        />
      </svg>
      <div className="space-y-0.5 min-w-0">
        <span className="text-xs text-slate-500 dark:text-slate-400 block">{label}</span>
        <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white block">{valueText}</span>
        <div className="text-xs space-y-0.5 pt-0.5 text-slate-600 dark:text-slate-300">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-xs bg-[#0E7C4F]" />
            <span className="truncate">{greenLabel}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-xs bg-[#EF4444]" />
            <span className="truncate">{redLabel}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

import React from 'react';

export default function KorxonaCenterDonut({ label, color, pct, amount, hint, dash, aria }) {
  return (
    <div className="flex items-center gap-4">
      <svg
        width="104"
        height="104"
        viewBox="0 0 112 112"
        role="img"
        aria-label={aria}
        className="shrink-0"
      >
        <circle cx="56" cy="56" r="44" fill="none" stroke="#EEF1F4" strokeWidth="12" className="dark:stroke-slate-800" />
        <circle
          cx="56"
          cy="56"
          r="44"
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeDasharray={dash}
          transform="rotate(-90 56 56)"
        />
        <text
          x="56"
          y="62"
          textAnchor="middle"
          fontSize="18"
          fontWeight="700"
          className="fill-slate-900 dark:fill-white font-mono"
        >
          {pct}
        </text>
      </svg>
      <div className="space-y-0.5 min-w-0">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
          <span style={{ backgroundColor: color }} className="w-2 h-2 rounded-xs" />
          {label}
        </span>
        <span className="text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-white block">
          {amount}
        </span>
        <span className="text-xs text-slate-400 dark:text-slate-500 block">
          {hint}
        </span>
      </div>
    </div>
  );
}

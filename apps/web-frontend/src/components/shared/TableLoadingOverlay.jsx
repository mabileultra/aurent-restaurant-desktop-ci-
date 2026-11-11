import React from 'react';

/**
 * Aurent Admin — Jadvallar uchun yengil .aa-spinner overlay'i.
 */
export default function TableLoadingOverlay({ text = 'Yuklanmoqda…' }) {
  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="table-loading-overlay"
      className="absolute inset-0 z-20 flex items-center justify-center bg-slate-900/10 dark:bg-slate-950/20 pointer-events-none"
    >
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm text-xs font-medium text-slate-700 dark:text-slate-200">
        <span className="aa-spinner text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
        <span>{text}</span>
      </div>
    </div>
  );
}

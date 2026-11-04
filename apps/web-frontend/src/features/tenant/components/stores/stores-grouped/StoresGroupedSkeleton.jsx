import React from 'react';

export default function StoresGroupedSkeleton() {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 animate-pulse">
        <div className="h-4 w-48 rounded bg-slate-200 dark:bg-slate-700/60" />
        <div className="h-6 w-24 rounded-lg bg-slate-100 dark:bg-slate-800" />
      </div>
      {Array.from({ length: 4 }).map((_, idx) => (
        <div
          key={`grouped-skeleton-${idx}`}
          className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 animate-pulse"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700/60" />
              <div className="space-y-2">
                <div className="h-4 w-40 rounded bg-slate-200 dark:bg-slate-700/60" />
                <div className="h-3 w-24 rounded bg-slate-100 dark:bg-slate-800" />
              </div>
            </div>
            <div className="h-6 w-16 rounded-full bg-slate-100 dark:bg-slate-800" />
          </div>
        </div>
      ))}
    </div>
  );
}

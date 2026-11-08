import React from 'react';
import PlatformSelect from '../../platform/components/PlatformSelect';

const FILTER_OPTIONS = [
  { id: 'all', label: 'Hammasi', countKey: 'all' },
  { id: 'active', label: 'Korxonasi bor', countKey: 'active' },
  { id: 'empty', label: 'Korxonasi yo‘q', countKey: 'empty' },
];

const SORT_OPTIONS = [
  { value: 'turnover', label: 'Aylanma bo‘yicha' },
  { value: 'companies', label: 'Korxonalar soni' },
  { value: 'connected', label: 'Ulanganlar ulushi' },
  { value: 'name', label: 'Nomi (A–Z)' },
];

export default function ViloyatlarFilterBar({
  filter,
  setFilter,
  counts,
  sort,
  setSort,
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
      <div
        role="group"
        aria-label="Hududlarni ajratish"
        className="flex flex-wrap items-center gap-2"
      >
        {FILTER_OPTIONS.map((f) => {
          const isActive = filter === f.id;
          const count = counts[f.countKey] ?? 0;
          return (
            <button
              key={f.id}
              type="button"
              aria-pressed={isActive}
              onClick={() => setFilter(f.id)}
              className={`h-10 px-3.5 inline-flex items-center gap-2 rounded-full text-xs sm:text-sm font-semibold transition cursor-pointer border ${
                isActive
                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                  : 'bg-white/85 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 text-slate-700 dark:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>{f.label}</span>
              <span
                className={`min-w-5 h-5 px-1.5 rounded-full inline-flex items-center justify-center text-xs font-bold ${
                  isActive
                    ? 'bg-white/25 text-white'
                    : 'bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-300'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
        <label htmlFor="viloyat-sort" className="shrink-0 font-medium">
          Saralash:
        </label>
        <div className="w-48">
          <PlatformSelect
            id="viloyat-sort"
            value={sort}
            onValueChange={setSort}
            options={SORT_OPTIONS}
            size="sm"
            theme="emerald"
          />
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { Search } from 'lucide-react';

export default function RoleTemplateDrawerToolbar({
  searchQuery,
  onSearchChange,
  filterMode,
  onFilterModeChange,
}) {
  return (
    <div className="px-6 py-3 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Modul nomi..."
          aria-label="Modul nomi bo‘yicha qidiruv"
          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3 py-1.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
        />
      </div>
      <div className="flex items-center gap-1 text-xs">
        {['ALL', 'ENABLED', 'DISABLED'].map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => onFilterModeChange(mode)}
            className={`rounded-lg px-2.5 py-1 font-semibold transition-colors cursor-pointer ${
              filterMode === mode
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
          >
            {mode === 'ALL' ? 'Hammasi' : mode === 'ENABLED' ? 'Yoqilgan' : 'O‘chirilgan'}
          </button>
        ))}
      </div>
    </div>
  );
}

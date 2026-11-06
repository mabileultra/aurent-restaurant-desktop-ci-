import React from 'react';
import { Search } from 'lucide-react';

export default function AccessRightsHistoryFiltersBar({
  search = '',
  onSearchChange,
  datePreset = '7d', // 'today' | '7d' | '30d'
  onDatePresetChange,
  actionType = 'all', // 'all' | 'template' | 'exception' | 'copy' | 'bulk'
  onActionTypeChange,
  counts = {},
}) {
  const chips = [
    { id: 'all', label: `Barcha amallar ${counts.all ?? 0}` },
    { id: 'template', label: `Shablon ${counts.template ?? 0}` },
    { id: 'exception', label: `Istisno ${counts.exception ?? 0}` },
    { id: 'copy', label: `Nusxa ${counts.copy ?? 0}` },
    { id: 'bulk', label: `Ommaviy ${counts.bulk ?? 0}` },
  ];

  return (
    <div className="space-y-3 p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Xodim, shablon yoki modul..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-8 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
          />
        </div>

        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          {[
            { id: 'today', label: 'Bugun' },
            { id: '7d', label: '7 kun' },
            { id: '30d', label: '30 kun' },
          ].map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => onDatePresetChange(preset.id)}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                datePreset === preset.id
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        {chips.map((chip) => (
          <button
            key={chip.id}
            type="button"
            onClick={() => onActionTypeChange(chip.id)}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
              actionType === chip.id
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {chip.label}
          </button>
        ))}
      </div>
    </div>
  );
}

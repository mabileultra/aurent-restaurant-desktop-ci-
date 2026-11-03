import React from 'react';
import { Search } from 'lucide-react';

const STATUS_KEYS = [
  { key: '', labelKey: 'platform.leads.filterAll', fallback: 'Hammasi', countKey: 'ALL' },
  { key: 'NEW', labelKey: 'platform.leads.statuses.NEW', fallback: 'Yangi', countKey: 'NEW' },
  { key: 'IN_PROGRESS', labelKey: 'platform.leads.statuses.IN_PROGRESS', fallback: 'Jarayonda', countKey: 'IN_PROGRESS' },
  { key: 'DONE', labelKey: 'platform.leads.statuses.DONE', fallback: 'Yakunlangan', countKey: 'DONE' },
  { key: 'REJECTED', labelKey: 'platform.leads.statuses.REJECTED', fallback: 'Rad etilgan', countKey: 'REJECTED' },
];

const TYPE_KEYS = [
  { key: '', labelKey: 'platform.leads.allTypes', fallback: 'Barcha turlar' },
  { key: 'DEMO', labelKey: 'platform.leads.types.DEMO', fallback: 'Demo' },
  { key: 'CONNECT', labelKey: 'platform.leads.types.CONNECT', fallback: 'Ulash' },
  { key: 'QUESTION', labelKey: 'platform.leads.types.QUESTION', fallback: 'Savol' },
  { key: 'EQUIPMENT', labelKey: 'platform.leads.types.EQUIPMENT', fallback: 'Uskunalar' },
];

export default function PlatformLeadsFilterToolbar({
  t,
  status,
  onStatusChange,
  counts = {},
  search,
  onSearchChange,
  leadType,
  onTypeChange,
}) {
  return (
    <div className="space-y-3">
      {/* 1. Status Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
        {STATUS_KEYS.map((item) => {
          const isActive = status === item.key;
          const count = counts[item.countKey] ?? 0;
          return (
            <button
              key={item.key}
              type="button"
              aria-pressed={isActive}
              onClick={() => onStatusChange(item.key)}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-slate-900 text-white shadow-xs dark:bg-white dark:text-slate-900'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700/80 dark:hover:text-white'
              }`}
            >
              <span>{t ? t(item.labelKey, { defaultValue: item.fallback }) : item.fallback}</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[11px] font-bold ${
                  isActive
                    ? 'bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900'
                    : 'bg-slate-200/90 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 2. Search + Lead Type Filter Toolbar */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        {/* Search Bar */}
        <div className="relative flex-1 sm:max-w-md">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t ? t('platform.leads.search', { defaultValue: 'Ism, telefon yoki email' }) : 'Ism, telefon yoki email'}
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 transition-colors focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-500"
          />
        </div>

        {/* Lead Type Pills */}
        <div className="inline-flex flex-wrap items-center gap-1 rounded-xl bg-slate-100/90 p-1 dark:bg-slate-800/80">
          {TYPE_KEYS.map((item) => {
            const isSelected = leadType === item.key;
            return (
              <button
                key={item.key}
                type="button"
                aria-pressed={isSelected}
                onClick={() => onTypeChange(item.key)}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-white text-emerald-800 shadow-2xs font-semibold dark:bg-slate-900 dark:text-emerald-300'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                {t ? t(item.labelKey, { defaultValue: item.fallback }) : item.fallback}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

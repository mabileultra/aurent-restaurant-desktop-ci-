import React from 'react';
import { Layers, List } from 'lucide-react';

export default function StoresPageControls({
  t,
  statusFilter,
  onStatusFilterChange,
  totalStores,
  activeStores,
  inactiveStores,
  viewMode,
  onViewModeChange,
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      {/* Segmented Status Tabs */}
      <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 text-xs font-semibold self-start sm:self-auto shadow-2xs">
        <button
          type="button"
          onClick={() => onStatusFilterChange('ALL')}
          className={`px-3 py-1.5 rounded-lg transition-all ${
            statusFilter === 'ALL'
              ? 'bg-white dark:!bg-slate-900 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          {t('platform.tabAll', { defaultValue: 'Barchasi' })}
          <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono">
            {totalStores}
          </span>
        </button>
        <button
          type="button"
          onClick={() => onStatusFilterChange('ACTIVE')}
          className={`px-3 py-1.5 rounded-lg transition-all ${
            statusFilter === 'ACTIVE'
              ? 'bg-white dark:!bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-emerald-600'
          }`}
        >
          {t('platform.tabActive', { defaultValue: 'Faol' })}
          <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-mono">
            {activeStores}
          </span>
        </button>
        <button
          type="button"
          onClick={() => onStatusFilterChange('INACTIVE')}
          className={`px-3 py-1.5 rounded-lg transition-all ${
            statusFilter === 'INACTIVE'
              ? inactiveStores > 0
                ? 'bg-white dark:!bg-slate-900 text-amber-700 dark:text-amber-400 shadow-xs'
                : 'bg-white dark:!bg-slate-900 text-slate-900 dark:text-white shadow-xs'
              : inactiveStores > 0
                ? 'text-slate-600 dark:text-slate-400 hover:text-amber-600'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          {t('platform.tabInactive', { defaultValue: 'Nofaol' })}
          <span
            className={`ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
              inactiveStores > 0
                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-semibold'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            {inactiveStores}
          </span>
        </button>
      </div>

      {/* View Switcher: Grouped by Company vs Flat Table */}
      <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 text-xs font-semibold self-start sm:self-auto shadow-2xs">
        <button
          type="button"
          onClick={() => onViewModeChange('grouped')}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
            viewMode === 'grouped'
              ? 'bg-white dark:!bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
          title={t('platform.viewGrouped', { defaultValue: 'Kompaniyalar bo‘yicha' })}
        >
          <Layers size={14} />
          <span>{t('platform.viewGrouped', { defaultValue: 'Kompaniyalar bo‘yicha' })}</span>
        </button>
        <button
          type="button"
          onClick={() => onViewModeChange('table')}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
            viewMode === 'table'
              ? 'bg-white dark:!bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
          title={t('platform.viewTable', { defaultValue: 'Yagona jadval' })}
        >
          <List size={14} />
          <span>{t('platform.viewTable', { defaultValue: 'Yagona jadval' })}</span>
        </button>
      </div>
    </div>
  );
}

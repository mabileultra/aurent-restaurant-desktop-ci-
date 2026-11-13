import React from 'react';
import { Download, UserCheck, UserX, X } from 'lucide-react';

/**
 * UsersTableBulkBar
 * Floating actions bar when one or more users are selected.
 */
export default function UsersTableBulkBar({
  selectedCount,
  allSelected,
  totalMatching,
  pageSize,
  isAllMatchingSelected,
  onSelectAllMatching,
  hasInactiveSelected,
  hasActiveSelected,
  onBulkToggleActive,
  onExportSelectedCsv,
  onClearSelection,
  t,
}) {
  if (selectedCount <= 0) return null;

  return (
    <div className="sticky bottom-6 flex justify-center z-30 pointer-events-none mt-4">
      <div className="pointer-events-auto flex flex-wrap items-center gap-2 sm:gap-3 px-4 py-2.5 rounded-2xl bg-slate-900/95 dark:bg-slate-800/95 text-white shadow-2xl border border-slate-700/80 animate-in fade-in slide-in-from-bottom-2 duration-200 max-w-full">
        <div className="flex items-center gap-2 pr-2 border-r border-slate-700 text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>
            {t('users.selectedCount', { count: selectedCount, defaultValue: `${selectedCount} ta tanlandi` })}
          </span>
          {allSelected && totalMatching > pageSize && (
            !isAllMatchingSelected ? (
              <button
                type="button"
                onClick={onSelectAllMatching}
                className="ml-1 text-xs text-emerald-300 hover:text-emerald-200 underline underline-offset-2 transition-colors cursor-pointer"
              >
                {t('users.selectAllMatching', { total: totalMatching, defaultValue: `Barcha ${totalMatching} tasini tanlash` })}
              </button>
            ) : (
              <span className="ml-1 text-xs text-emerald-400 font-medium">
                {t('users.allMatchingSelected', { total: totalMatching, defaultValue: `Barcha ${totalMatching} ta tanlangan` })}
              </span>
            )
          )}
        </div>

        {hasInactiveSelected && (
          <button
            type="button"
            onClick={() => onBulkToggleActive?.(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-emerald-300 border border-slate-700 hover:border-emerald-500/40 transition-colors cursor-pointer"
          >
            <UserCheck size={14} className="text-emerald-400" />
            <span>{t('users.activate', { defaultValue: 'Faollashtirish' })}</span>
          </button>
        )}

        {hasActiveSelected && (
          <button
            type="button"
            onClick={() => onBulkToggleActive?.(false)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-amber-300 border border-slate-700 hover:border-amber-500/40 transition-colors cursor-pointer"
          >
            <UserX size={14} className="text-amber-400" />
            <span>{t('users.deactivate', { defaultValue: 'Faolsizlantirish' })}</span>
          </button>
        )}

        <button
          type="button"
          onClick={onExportSelectedCsv}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 hover:border-slate-500 transition-colors cursor-pointer"
        >
          <Download size={14} className="text-slate-300" />
          <span>{t('common.exportCsv', { defaultValue: 'Eksport (CSV)' })}</span>
        </button>

        <button
          type="button"
          onClick={onClearSelection}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-1 cursor-pointer"
          aria-label={t('common.cancel', { defaultValue: 'Bekor qilish' })}
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

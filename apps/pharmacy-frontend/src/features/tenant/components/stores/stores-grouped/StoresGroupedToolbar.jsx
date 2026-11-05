import React from 'react';
import { ChevronsDown, ChevronsUp } from 'lucide-react';

export default function StoresGroupedToolbar({
  t,
  total,
  branchCount,
  allAreExpanded,
  onExpandAll,
  onCollapseAll,
}) {
  return (
    <div
      id="stores-grouped-toolbar"
      className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs"
    >
      <div className="flex items-center gap-2.5">
        <span className="font-bold text-slate-900 dark:text-white text-sm">
          {t('platform.companiesNetworkTitle', { defaultValue: 'Kompaniyalar tarmog‘i' })}
        </span>
        <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono font-semibold text-xs border border-slate-200/80 dark:border-slate-700">
          {total} ta kompaniya • {branchCount} ta filial
        </span>
      </div>

      <button
        type="button"
        onClick={allAreExpanded ? onCollapseAll : onExpandAll}
        className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-2xs transition-all active:scale-[0.98] self-start sm:self-auto"
      >
        {allAreExpanded ? (
          <>
            <ChevronsUp size={15} className="text-slate-500 dark:text-slate-400" />
            <span>{t('platform.groupedCollapseAll', { defaultValue: 'Barchasini yopish' })}</span>
          </>
        ) : (
          <>
            <ChevronsDown size={15} className="text-slate-500 dark:text-slate-400" />
            <span>{t('platform.groupedExpandAll', { defaultValue: 'Barchasini ochish' })}</span>
          </>
        )}
      </button>
    </div>
  );
}

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
      className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-4 py-3 rounded-aa-lg bg-aa-surface border border-aa-line shadow-none"
    >
      <div className="flex items-center gap-2.5">
        <span className="font-semibold text-aa-ink text-sm">
          {t('platform.companiesNetworkTitle', { defaultValue: 'Kompaniyalar tarmog‘i' })}
        </span>
        <span className="px-2.5 py-0.5 rounded-full bg-aa-surface-sunken text-aa-ink-muted aa-num font-medium text-xs border border-aa-line">
          {total} ta kompaniya • {branchCount} ta filial
        </span>
      </div>

      <button
        type="button"
        onClick={allAreExpanded ? onCollapseAll : onExpandAll}
        className="aa-btn aa-btn--secondary aa-size-md inline-flex items-center justify-center gap-1.5 self-start sm:self-auto cursor-pointer"
      >
        {allAreExpanded ? (
          <>
            <ChevronsUp size={16} className="text-aa-ink-muted" />
            <span>{t('platform.groupedCollapseAll', { defaultValue: 'Barchasini yopish' })}</span>
          </>
        ) : (
          <>
            <ChevronsDown size={16} className="text-aa-ink-muted" />
            <span>{t('platform.groupedExpandAll', { defaultValue: 'Barchasini ochish' })}</span>
          </>
        )}
      </button>
    </div>
  );
}

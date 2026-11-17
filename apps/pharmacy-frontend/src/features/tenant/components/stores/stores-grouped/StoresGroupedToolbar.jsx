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
      className="ui-card flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-4 py-3"
    >
      <div className="flex items-center gap-2.5">
        <span className="font-bold text-ink text-sm">
          {t('platform.companiesNetworkTitle', { defaultValue: 'Kompaniyalar tarmog‘i' })}
        </span>
        <span className="ui-badge-neutral ui-tabular">
          {total} ta kompaniya • {branchCount} ta filial
        </span>
      </div>

      <button
        type="button"
        onClick={allAreExpanded ? onCollapseAll : onExpandAll}
        className="ui-btn ui-btn-secondary ui-btn-sm self-start sm:self-auto"
      >
        {allAreExpanded ? (
          <>
            <ChevronsUp size={15} strokeWidth={1.75} className="text-ink-muted" />
            <span>{t('platform.groupedCollapseAll', { defaultValue: 'Barchasini yopish' })}</span>
          </>
        ) : (
          <>
            <ChevronsDown size={15} strokeWidth={1.75} className="text-ink-muted" />
            <span>{t('platform.groupedExpandAll', { defaultValue: 'Barchasini ochish' })}</span>
          </>
        )}
      </button>
    </div>
  );
}

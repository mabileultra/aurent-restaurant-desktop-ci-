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
      <div className="aa-size-seg flex items-center p-1 rounded-aa-md bg-aa-surface-sunken border border-aa-line font-semibold w-full sm:w-auto overflow-x-auto shadow-none">
        <button
          type="button"
          onClick={() => onStatusFilterChange('ALL')}
          className={`aa-size-seg-btn flex-1 sm:flex-initial whitespace-nowrap rounded-[6px] transition-all inline-flex items-center justify-center font-semibold cursor-pointer ${
            statusFilter === 'ALL'
              ? 'bg-aa-surface text-aa-ink shadow-xs'
              : 'text-aa-ink-muted hover:text-aa-ink'
          }`}
        >
          <span>{t('platform.tabAll', { defaultValue: 'Barchasi' })}</span>
          <span className="ml-1.5 px-2 py-0.5 rounded-full text-[12px] leading-4 bg-aa-surface-sunken text-aa-ink-muted aa-num font-medium">
            {totalStores}
          </span>
        </button>
        <button
          type="button"
          onClick={() => onStatusFilterChange('ACTIVE')}
          className={`aa-size-seg-btn flex-1 sm:flex-initial whitespace-nowrap rounded-[6px] transition-all inline-flex items-center justify-center font-semibold cursor-pointer ${
            statusFilter === 'ACTIVE'
              ? 'bg-aa-surface text-aa-ink shadow-xs'
              : 'text-aa-ink-muted hover:text-aa-ink'
          }`}
        >
          <span>{t('platform.tabActive', { defaultValue: 'Faol' })}</span>
          <span className="ml-1.5 px-2 py-0.5 rounded-full text-[12px] leading-4 bg-aa-surface-sunken text-aa-ink-muted aa-num font-medium">
            {activeStores}
          </span>
        </button>
        <button
          type="button"
          onClick={() => onStatusFilterChange('INACTIVE')}
          className={`aa-size-seg-btn flex-1 sm:flex-initial whitespace-nowrap rounded-[6px] transition-all inline-flex items-center justify-center font-semibold cursor-pointer ${
            statusFilter === 'INACTIVE'
              ? 'bg-aa-surface text-aa-ink shadow-xs'
              : 'text-aa-ink-muted hover:text-aa-ink'
          }`}
        >
          <span>{t('platform.tabInactive', { defaultValue: 'Nofaol' })}</span>
          <span className="ml-1.5 px-2 py-0.5 rounded-full text-[12px] leading-4 bg-aa-surface-sunken text-aa-ink-muted aa-num font-medium">
            {inactiveStores}
          </span>
        </button>
      </div>

      {/* View Switcher: Grouped by Company vs Flat Table */}
      <div className="aa-size-seg flex items-center p-1 rounded-aa-md bg-aa-surface-sunken border border-aa-line font-semibold w-full sm:w-auto shadow-none">
        <button
          type="button"
          onClick={() => onViewModeChange('grouped')}
          className={`aa-size-seg-btn flex-1 sm:flex-initial whitespace-nowrap rounded-[6px] transition-all inline-flex items-center justify-center gap-1.5 font-semibold cursor-pointer ${
            viewMode === 'grouped'
              ? 'bg-aa-surface text-aa-ink shadow-xs'
              : 'text-aa-ink-muted hover:text-aa-ink'
          }`}
          title={t('platform.viewGrouped', { defaultValue: 'Kompaniyalar bo‘yicha' })}
        >
          <Layers size={16} className="text-aa-ink-muted shrink-0" />
          <span>{t('platform.viewGrouped', { defaultValue: 'Kompaniyalar bo‘yicha' })}</span>
        </button>
        <button
          type="button"
          onClick={() => onViewModeChange('table')}
          className={`aa-size-seg-btn flex-1 sm:flex-initial whitespace-nowrap rounded-[6px] transition-all inline-flex items-center justify-center gap-1.5 font-semibold cursor-pointer ${
            viewMode === 'table'
              ? 'bg-aa-surface text-aa-ink shadow-xs'
              : 'text-aa-ink-muted hover:text-aa-ink'
          }`}
          title={t('platform.viewTable', { defaultValue: 'Yagona jadval' })}
        >
          <List size={16} className="text-aa-ink-muted shrink-0" />
          <span>{t('platform.viewTable', { defaultValue: 'Yagona jadval' })}</span>
        </button>
      </div>
    </div>
  );
}

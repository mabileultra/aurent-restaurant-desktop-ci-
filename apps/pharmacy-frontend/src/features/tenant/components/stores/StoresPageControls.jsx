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
      <div className="ui-tabs self-start sm:self-auto">
        <button
          type="button"
          onClick={() => onStatusFilterChange('ALL')}
          className={`ui-tab ${statusFilter === 'ALL' ? 'ui-tab-active' : ''}`}
        >
          {t('platform.tabAll', { defaultValue: 'Barchasi' })}
          <span className="ui-tabular rounded-full bg-canvas px-1.5 text-[11px] text-ink-muted">
            {totalStores}
          </span>
        </button>
        <button
          type="button"
          onClick={() => onStatusFilterChange('ACTIVE')}
          className={`ui-tab ${statusFilter === 'ACTIVE' ? 'ui-tab-active' : ''}`}
        >
          {t('platform.tabActive', { defaultValue: 'Faol' })}
          <span className="ui-tabular rounded-full bg-success-soft px-1.5 text-[11px] text-success-text">
            {activeStores}
          </span>
        </button>
        <button
          type="button"
          onClick={() => onStatusFilterChange('INACTIVE')}
          className={`ui-tab ${statusFilter === 'INACTIVE' ? 'ui-tab-active' : ''}`}
        >
          {t('platform.tabInactive', { defaultValue: 'Nofaol' })}
          <span
            className={`ui-tabular rounded-full px-1.5 text-[11px] ${
              inactiveStores > 0
                ? 'bg-warning-soft text-warning-text font-semibold'
                : 'bg-canvas text-ink-muted'
            }`}
          >
            {inactiveStores}
          </span>
        </button>
      </div>

      {/* View Switcher: Grouped by Company vs Flat Table */}
      <div className="ui-tabs self-start sm:self-auto">
        <button
          type="button"
          onClick={() => onViewModeChange('grouped')}
          className={`ui-tab ${viewMode === 'grouped' ? 'ui-tab-active' : ''}`}
          title={t('platform.viewGrouped', { defaultValue: 'Kompaniyalar bo‘yicha' })}
        >
          <Layers size={14} strokeWidth={1.75} />
          <span>{t('platform.viewGrouped', { defaultValue: 'Kompaniyalar bo‘yicha' })}</span>
        </button>
        <button
          type="button"
          onClick={() => onViewModeChange('table')}
          className={`ui-tab ${viewMode === 'table' ? 'ui-tab-active' : ''}`}
          title={t('platform.viewTable', { defaultValue: 'Yagona jadval' })}
        >
          <List size={14} strokeWidth={1.75} />
          <span>{t('platform.viewTable', { defaultValue: 'Yagona jadval' })}</span>
        </button>
      </div>
    </div>
  );
}

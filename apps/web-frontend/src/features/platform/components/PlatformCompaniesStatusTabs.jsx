import React from 'react';

export default function PlatformCompaniesStatusTabs({
  statusFilter,
  onStatusFilterChange,
  totalCompanies,
  activeCompanies,
  inactiveCompanies,
  t,
}) {
  const tabs = [
    {
      id: 'ALL',
      label: t('platform.tabAll', { defaultValue: 'Barchasi' }),
      count: totalCompanies,
    },
    {
      id: 'ACTIVE',
      label: t('platform.tabActive', { defaultValue: 'Faol' }),
      count: activeCompanies,
    },
    {
      id: 'INACTIVE',
      label: t('platform.tabInactive', { defaultValue: 'Nofaol' }),
      count: inactiveCompanies,
    },
  ];

  return (
    <div className="aa-size-seg flex items-center rounded-aa-md bg-aa-surface-sunken border border-aa-line font-semibold w-full sm:w-auto overflow-x-auto overflow-y-hidden shadow-none">
      {tabs.map((tab) => {
        const isActive = statusFilter === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onStatusFilterChange(tab.id)}
            className={`aa-size-seg-btn flex-1 sm:flex-initial whitespace-nowrap rounded-aa-sm transition-all inline-flex items-center justify-center font-semibold cursor-pointer ${
              isActive
                ? 'bg-aa-surface text-aa-ink shadow-xs'
                : 'text-aa-ink-muted hover:text-aa-ink'
            }`}
          >
            <span>{tab.label}</span>
            <span className="ml-1.5 px-2 py-0.5 rounded-full text-xs leading-4 bg-aa-surface-sunken text-aa-ink-muted aa-num font-medium">
              {tab.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

import React from 'react';
import { AlertCircle, Building2, CheckCircle2, Store } from 'lucide-react';

export default function PlatformCompanyStatsCards({
  t,
  totalCompanies = 0,
  activeCompanies = 0,
  inactiveCompanies = 0,
  totalStores = 0,
  statusFilter = 'ALL',
  onStatusFilterChange,
  onStoresClick,
  isPending = false,
}) {
  const activeHint = isPending || totalCompanies === 0
    ? '—'
    : `${Math.round((activeCompanies / totalCompanies) * 100)}% ${t('platform.statsActivePercent', { defaultValue: 'faoliyatda' })}`;

  const cards = [
    {
      id: 'ALL',
      title: t('platform.statsAll', { defaultValue: 'Jami kompaniyalar' }),
      value: totalCompanies,
      hint: t('platform.statsAllDesc', { defaultValue: 'Platformaga ulangan' }),
      icon: Building2,
      activeRing: 'border-aa-brand ring-1 ring-aa-brand aa-kpi-active-ring',
    },
    {
      id: 'ACTIVE',
      title: t('platform.statsActive', { defaultValue: 'Faol kompaniyalar' }),
      value: activeCompanies,
      hint: activeHint,
      icon: CheckCircle2,
      activeRing: 'border-aa-brand ring-1 ring-aa-brand aa-kpi-active-ring',
    },
    {
      id: 'STORES',
      title: t('platform.statsStores', { defaultValue: 'Ulangan do‘konlar' }),
      value: totalStores,
      hint: t('platform.statsStoresDesc', { defaultValue: 'Barcha savdo nuqtalari' }),
      icon: Store,
      activeRing: '',
      isFilterable: false,
    },
    {
      id: 'INACTIVE',
      title: t('platform.statsInactive', { defaultValue: 'Nofaollar' }),
      value: inactiveCompanies,
      hint: t('platform.statsInactiveDesc', { defaultValue: 'E’tibor talab / to‘xtatilgan' }),
      icon: AlertCircle,
      activeRing: 'border-aa-brand ring-1 ring-aa-brand aa-kpi-active-ring',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        const isFilterActive = card.isFilterable !== false && statusFilter === card.id;
        const isClickable = card.id === 'STORES' ? true : Boolean(onStatusFilterChange);

        const handleClick = () => {
          if (card.id === 'STORES') {
            onStoresClick?.();
          } else if (onStatusFilterChange) {
            onStatusFilterChange(card.id);
          }
        };

        return (
          <div
            key={card.id}
            role="button"
            tabIndex={0}
            onClick={handleClick}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleClick();
              }
            }}
            className={`relative p-3.5 sm:p-4 rounded-aa-lg bg-aa-surface border transition-all duration-200 shadow-none ${
              isFilterActive
                ? card.activeRing
                : 'border-aa-line hover:border-aa-line-strong'
            } cursor-pointer hover:bg-aa-surface-hover hover:-translate-y-0.5`}
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <Icon size={16} className="text-aa-ink-muted shrink-0" aria-hidden="true" />
              <span className="text-[12px] font-semibold leading-4 text-aa-ink-muted truncate">
                {card.title}
              </span>
            </div>

            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-[22px] font-bold leading-7 text-aa-ink aa-num">
                {isPending || card.value == null ? '—' : Number(card.value).toLocaleString('uz-UZ')}
              </span>
            </div>

            <p className="mt-1 text-[13px] leading-[18px] text-aa-ink-muted truncate">
              {card.hint}
            </p>
          </div>
        );
      })}
    </div>
  );
}

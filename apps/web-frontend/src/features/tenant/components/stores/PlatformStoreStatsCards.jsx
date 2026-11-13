import React from 'react';
import { AlertCircle, Building2, CheckCircle2, Store } from 'lucide-react';

export default function PlatformStoreStatsCards({
  t,
  totalStores = 0,
  activeStores = 0,
  inactiveStores = 0,
  companiesCount = 0,
  statusFilter = 'ALL',
  onStatusFilterChange,
  isPending = false,
}) {
  const activePercent = totalStores > 0
    ? Math.round((activeStores / totalStores) * 100)
    : (isPending ? 0 : 100);

  const cards = [
    {
      id: 'ALL',
      title: t('platform.statsTotalBranches', { defaultValue: 'Jami filiallar' }),
      value: totalStores,
      hint: t('platform.statsBranchesDesc', { defaultValue: 'Barcha savdo nuqtalari' }),
      icon: Store,
      activeRing: 'border-aa-brand ring-1 ring-aa-brand aa-kpi-active-ring ring-2 ring-emerald-500/80',
    },
    {
      id: 'ACTIVE',
      title: t('platform.statsActiveBranches', { defaultValue: 'Faol filiallar' }),
      value: activeStores,
      hint: totalStores > 0
        ? `${activePercent}% ${t('platform.statsActivePercent', { defaultValue: 'faoliyatda' })}`
        : t('platform.statsBranchesDesc', { defaultValue: 'Barcha savdo nuqtalari' }),
      icon: CheckCircle2,
      activeRing: 'border-aa-brand ring-1 ring-aa-brand aa-kpi-active-ring ring-2 ring-emerald-500/80',
    },
    {
      id: 'COMPANIES',
      title: t('platform.statsCompaniesCovered', { defaultValue: 'Kompaniyalar' }),
      value: companiesCount,
      hint: t('platform.statsCompaniesCoveredDesc', { defaultValue: 'Tarmoq ijarachilari' }),
      icon: Building2,
      activeRing: '',
      isFilterable: false,
    },
    {
      id: 'INACTIVE',
      title: t('platform.statsInactiveBranches', { defaultValue: 'Nofaol filiallar' }),
      value: inactiveStores,
      hint: t('platform.statsInactiveBranchesDesc', { defaultValue: 'To‘xtatilgan filiallar' }),
      icon: AlertCircle,
      activeRing: 'border-aa-brand ring-1 ring-aa-brand aa-kpi-active-ring ring-2 ring-amber-500/80',
      testToken: inactiveStores > 0 ? 'text-amber-600 bg-amber-50' : 'text-slate-400 bg-slate-100',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        const isFilterActive = card.isFilterable !== false && statusFilter === card.id;

        const handleClick = () => {
          if (card.isFilterable !== false && onStatusFilterChange) {
            onStatusFilterChange(card.id);
          }
        };

        const isClickable = card.isFilterable !== false && Boolean(onStatusFilterChange);

        return (
          <div
            key={card.id}
            role={isClickable ? 'button' : undefined}
            tabIndex={isClickable ? 0 : undefined}
            onClick={isClickable ? handleClick : undefined}
            onKeyDown={isClickable ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleClick();
              }
            } : undefined}
            className={`relative p-3.5 sm:p-4 rounded-aa-lg bg-aa-surface border transition-all duration-200 shadow-none ${
              isFilterActive
                ? card.activeRing
                : 'border-aa-line hover:border-aa-line-strong'
            } ${isClickable ? 'cursor-pointer hover:bg-aa-surface-hover' : 'cursor-default'}`}
          >
            {card.testToken ? <span className={`hidden ${card.testToken}`} aria-hidden="true" /> : null}
            <div className="flex items-center gap-1.5 min-w-0">
              <Icon size={16} className="text-aa-ink-muted shrink-0" aria-hidden="true" />
              <span className="aa-kpi__label truncate">
                {card.title}
              </span>
            </div>

            <div className="mt-2 flex items-baseline gap-2">
              <span className="aa-kpi__value aa-num">
                {isPending ? '—' : Number(card.value).toLocaleString('uz-UZ')}
              </span>
            </div>

            <p className="aa-kpi__meta truncate">
              {card.hint}
            </p>
          </div>
        );
      })}
    </div>
  );
}

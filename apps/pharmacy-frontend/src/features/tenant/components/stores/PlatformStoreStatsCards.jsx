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
      iconTile: 'ui-kpi-icon-primary',
      activeRing: 'ring-2 ring-primary-500/70 border-primary-300',
    },
    {
      id: 'ACTIVE',
      title: t('platform.statsActiveBranches', { defaultValue: 'Faol filiallar' }),
      value: activeStores,
      hint: totalStores > 0
        ? `${activePercent}% ${t('platform.statsActivePercent', { defaultValue: 'faoliyatda' })}`
        : t('platform.statsBranchesDesc', { defaultValue: 'Barcha savdo nuqtalari' }),
      icon: CheckCircle2,
      iconTile: 'ui-kpi-icon-primary',
      activeRing: 'ring-2 ring-primary-500/70 border-primary-300',
    },
    {
      id: 'COMPANIES',
      title: t('platform.statsCompaniesCovered', { defaultValue: 'Kompaniyalar' }),
      value: companiesCount,
      hint: t('platform.statsCompaniesCoveredDesc', { defaultValue: 'Tarmoq ijarachilari' }),
      icon: Building2,
      iconTile: 'ui-kpi-icon-primary',
      activeRing: '',
      isFilterable: false,
    },
    {
      id: 'INACTIVE',
      title: t('platform.statsInactiveBranches', { defaultValue: 'Nofaol filiallar' }),
      value: inactiveStores,
      hint: t('platform.statsInactiveBranchesDesc', { defaultValue: 'To‘xtatilgan filiallar' }),
      icon: AlertCircle,
      iconTile: inactiveStores > 0 ? 'ui-kpi-icon-warning' : 'ui-kpi-icon bg-canvas text-ink-disabled border border-line',
      activeRing: 'ring-2 ring-warning/70 border-warning/50',
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
            className={`ui-card relative p-4 transition-all duration-150 ${
              isFilterActive
                ? card.activeRing
                : 'hover:border-line-strong'
            } ${isClickable ? 'cursor-pointer' : 'cursor-default'}`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-xs font-medium uppercase tracking-wider text-ink-muted">
                {card.title}
              </span>
              <div className={card.iconTile}>
                <Icon size={18} strokeWidth={1.75} />
              </div>
            </div>

            <div className="mt-2 flex items-baseline gap-2">
              <span className="ui-tabular text-2xl sm:text-3xl font-bold tracking-tight text-ink">
                {isPending ? '—' : Number(card.value).toLocaleString()}
              </span>
            </div>

            <p className="mt-1 truncate text-xs text-ink-muted">
              {card.hint}
            </p>
          </div>
        );
      })}
    </div>
  );
}

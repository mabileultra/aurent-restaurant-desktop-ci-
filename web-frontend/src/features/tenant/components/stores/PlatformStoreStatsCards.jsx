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
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      iconBg: 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-900/60',
      activeRing: 'ring-2 ring-emerald-500/80 border-emerald-300 dark:border-emerald-700',
    },
    {
      id: 'ACTIVE',
      title: t('platform.statsActiveBranches', { defaultValue: 'Faol filiallar' }),
      value: activeStores,
      hint: totalStores > 0
        ? `${activePercent}% ${t('platform.statsActivePercent', { defaultValue: 'faoliyatda' })}`
        : t('platform.statsBranchesDesc', { defaultValue: 'Barcha savdo nuqtalari' }),
      icon: CheckCircle2,
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      iconBg: 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-900/60',
      activeRing: 'ring-2 ring-emerald-500/80 border-emerald-300 dark:border-emerald-700',
    },
    {
      id: 'COMPANIES',
      title: t('platform.statsCompaniesCovered', { defaultValue: 'Kompaniyalar qamrovi' }),
      value: companiesCount,
      hint: t('platform.statsCompaniesCoveredDesc', { defaultValue: 'Tarmoq ijarachilari' }),
      icon: Building2,
      iconColor: 'text-sky-600 dark:text-sky-400',
      iconBg: 'bg-sky-50 dark:bg-sky-950/60 border border-sky-100 dark:border-sky-900/60',
      activeRing: '',
      isFilterable: false,
    },
    {
      id: 'INACTIVE',
      title: t('platform.statsInactiveBranches', { defaultValue: 'Nofaol filiallar' }),
      value: inactiveStores,
      hint: t('platform.statsInactiveBranchesDesc', { defaultValue: 'To‘xtatilgan filiallar' }),
      icon: AlertCircle,
      iconColor: inactiveStores > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400',
      iconBg: inactiveStores > 0
        ? 'bg-amber-50 dark:bg-amber-950/60 border border-amber-100 dark:border-amber-900/60'
        : 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700',
      activeRing: 'ring-2 ring-amber-500/80 border-amber-300 dark:border-amber-700',
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
            className={`relative p-3.5 sm:p-4 rounded-xl bg-white dark:!bg-slate-900/90 border transition-all duration-200 shadow-sm ${
              isFilterActive
                ? card.activeRing
                : 'border-slate-200 dark:!border-slate-800 hover:border-slate-300 dark:hover:!border-slate-700'
            } ${isClickable ? 'cursor-pointer hover:shadow hover:-translate-y-0.5' : 'cursor-default'}`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">
                {card.title}
              </span>
              <div className={`p-1.5 sm:p-2 rounded-lg shrink-0 ${card.iconBg}`}>
                <Icon size={18} className={card.iconColor} />
              </div>
            </div>

            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                {isPending ? '—' : Number(card.value).toLocaleString()}
              </span>
            </div>

            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 truncate">
              {card.hint}
            </p>
          </div>
        );
      })}
    </div>
  );
}

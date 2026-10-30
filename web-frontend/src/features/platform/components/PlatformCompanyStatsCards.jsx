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
  const activeHint = isPending
    ? t('platform.statsActivePercent', { defaultValue: 'faoliyatda' })
    : totalCompanies > 0
      ? `${Math.round((activeCompanies / totalCompanies) * 100)}% ${t('platform.statsActivePercent', { defaultValue: 'faoliyatda' })}`
      : `0% ${t('platform.statsActivePercent', { defaultValue: 'faoliyatda' })}`;

  const cards = [
    {
      id: 'ALL',
      title: t('platform.statsAll', { defaultValue: 'Jami kompaniyalar' }),
      value: totalCompanies,
      hint: t('platform.statsAllDesc', { defaultValue: 'Platformaga ulangan' }),
      icon: Building2,
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      iconBg: 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-900/60',
      activeRing: 'ring-2 ring-emerald-500/80 border-emerald-300 dark:border-emerald-700',
    },
    {
      id: 'ACTIVE',
      title: t('platform.statsActive', { defaultValue: 'Faol kompaniyalar' }),
      value: activeCompanies,
      hint: activeHint,
      icon: CheckCircle2,
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      iconBg: 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-900/60',
      activeRing: 'ring-2 ring-emerald-500/80 border-emerald-300 dark:border-emerald-700',
    },
    {
      id: 'STORES',
      title: t('platform.statsStores', { defaultValue: 'Ulangan do‘konlar' }),
      value: totalStores,
      hint: t('platform.statsStoresDesc', { defaultValue: 'Barcha savdo nuqtalari' }),
      icon: Store,
      iconColor: 'text-sky-600 dark:text-sky-400',
      iconBg: 'bg-sky-50 dark:bg-sky-950/60 border border-sky-100 dark:border-sky-900/60',
      activeRing: '',
      isFilterable: false,
    },
    {
      id: 'INACTIVE',
      title: t('platform.statsInactive', { defaultValue: 'Nofaollar' }),
      value: inactiveCompanies,
      hint: t('platform.statsInactiveDesc', { defaultValue: 'E’tibor talab / to‘xtatilgan' }),
      icon: AlertCircle,
      iconColor: inactiveCompanies > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400',
      iconBg: inactiveCompanies > 0
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
            className={`relative p-3.5 sm:p-4 rounded-xl bg-white dark:!bg-slate-900/90 border transition-all duration-200 shadow-sm ${
              isFilterActive
                ? card.activeRing
                : 'border-slate-200 dark:!border-slate-800 hover:border-slate-300 dark:hover:!border-slate-700'
            } cursor-pointer hover:shadow hover:-translate-y-0.5`}
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

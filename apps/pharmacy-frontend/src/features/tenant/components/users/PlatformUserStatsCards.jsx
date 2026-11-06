import React from 'react';
import { ShieldCheck, Store, UserCheck, Users } from 'lucide-react';

export default function PlatformUserStatsCards({
  t,
  totalUsers = 0,
  activeUsers = 0,
  adminUsers = 0,
  staffUsers = 0,
  statusFilter = 'ALL',
  roleFilter = 'ALL',
  onStatusFilterChange,
  onRoleFilterChange,
  isPending = false,
  hasActiveFilters = false,
}) {
  const activePercent = totalUsers > 0
    ? Math.round((activeUsers / totalUsers) * 100)
    : 100;

  const cards = [
    {
      id: 'TOTAL',
      title: t('users.statsAll', { defaultValue: 'Jami foydalanuvchilar' }),
      value: totalUsers,
      hint: hasActiveFilters
        ? t('users.statsFiltered', { defaultValue: 'Filtr bo‘yicha' })
        : t('users.statsAllDesc', { defaultValue: 'Platformada ro‘yxatdan o‘tgan' }),
      icon: Users,
      iconColor: 'text-slate-700 dark:text-slate-300',
      iconBg: 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700',
      activeRing: 'ring-2 ring-slate-600 bg-slate-50 dark:bg-slate-800/80 border-slate-400 dark:border-slate-500 shadow-md',
      isActive: statusFilter === 'ALL' && roleFilter === 'ALL',
      onClick: () => {
        onStatusFilterChange?.('ALL');
        onRoleFilterChange?.('ALL');
      },
    },
    {
      id: 'ACTIVE',
      title: t('users.statsActive', { defaultValue: 'Faol foydalanuvchilar' }),
      value: activeUsers,
      hint: `${activePercent}% ${t('users.statsActivePercent', { defaultValue: 'tizimda faol' })}`,
      icon: UserCheck,
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      iconBg: 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-900/60',
      activeRing: 'ring-2 ring-emerald-600 bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-600 shadow-md',
      isActive: statusFilter === 'ACTIVE',
      onClick: () => {
        onStatusFilterChange?.(statusFilter === 'ACTIVE' ? 'ALL' : 'ACTIVE');
      },
    },
    {
      id: 'MANAGEMENT',
      title: t('users.statsManagement', { defaultValue: 'Boshqaruv xodimlari' }),
      value: adminUsers,
      hint: t('users.statsManagementDesc', { defaultValue: 'Admin, menejer, operatorlar' }),
      icon: ShieldCheck,
      iconColor: 'text-purple-600 dark:text-purple-400',
      iconBg: 'bg-purple-50 dark:bg-purple-950/60 border border-purple-100 dark:border-purple-900/60',
      activeRing: 'ring-2 ring-purple-600 bg-purple-50/80 dark:bg-purple-950/40 border-purple-400 dark:border-purple-600 shadow-md',
      isActive: roleFilter === 'MANAGEMENT',
      onClick: () => {
        onRoleFilterChange?.(roleFilter === 'MANAGEMENT' ? 'ALL' : 'MANAGEMENT');
      },
    },
    {
      id: 'STAFF',
      title: t('users.statsStaff', { defaultValue: 'Kassa va Operatsiya' }),
      value: staffUsers,
      hint: t('users.statsStaffDesc', { defaultValue: 'Kassa, zal va oshxona' }),
      icon: Store,
      iconColor: 'text-sky-600 dark:text-sky-400',
      iconBg: 'bg-sky-50 dark:bg-sky-950/60 border border-sky-100 dark:border-sky-900/60',
      activeRing: 'ring-2 ring-sky-600 bg-sky-50/80 dark:bg-sky-950/40 border-sky-400 dark:border-sky-600 shadow-md',
      isActive: roleFilter === 'STAFF',
      onClick: () => {
        onRoleFilterChange?.(roleFilter === 'STAFF' ? 'ALL' : 'STAFF');
      },
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div
            key={card.id}
            role="button"
            tabIndex={0}
            aria-pressed={card.isActive}
            onClick={card.onClick}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                card.onClick();
              }
            }}
            className={`relative p-3.5 sm:p-4 rounded-xl bg-white dark:!bg-slate-900/90 transition-all duration-200 shadow-sm ${
              card.isActive
                ? `${card.activeRing} border-2`
                : 'border border-slate-200 dark:!border-slate-800 hover:border-slate-300 dark:hover:!border-slate-700'
            } cursor-pointer hover:shadow hover:-translate-y-0.5`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">
                {card.title}
              </span>
              <div className={`p-2 rounded-lg shrink-0 ${card.iconBg}`}>
                <Icon size={18} className={card.iconColor} aria-hidden />
              </div>
            </div>

            <div className="mt-2 flex items-baseline gap-2">
              {isPending ? (
                <div className="h-8 w-16 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
              ) : (
                <span className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {card.value.toLocaleString()}
                </span>
              )}
            </div>

            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500 truncate">
              {card.hint}
            </p>
          </div>
        );
      })}
    </div>
  );
}

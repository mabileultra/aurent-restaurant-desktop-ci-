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
      shortTitle: t('users.statsAllShort', { defaultValue: 'Jami' }),
      value: totalUsers,
      hint: hasActiveFilters
        ? t('users.statsFiltered', { defaultValue: 'Filtr bo‘yicha' })
        : t('users.statsAllDesc', { defaultValue: 'Platformada ro‘yxatdan o‘tgan' }),
      icon: Users,
      activeRing: 'border-aa-brand ring-1 ring-aa-brand aa-kpi-active-ring',
      isActive: statusFilter === 'ALL' && roleFilter === 'ALL',
      onClick: () => {
        onStatusFilterChange?.('ALL');
        onRoleFilterChange?.('ALL');
      },
    },
    {
      id: 'ACTIVE',
      title: t('users.statsActive', { defaultValue: 'Faol foydalanuvchilar' }),
      shortTitle: t('users.statsActiveShort', { defaultValue: 'Faollar' }),
      value: activeUsers,
      hint: `${activePercent}% ${t('users.statsActivePercent', { defaultValue: 'tizimda faol' })}`,
      icon: UserCheck,
      activeRing: 'border-aa-brand ring-1 ring-aa-brand aa-kpi-active-ring',
      isActive: statusFilter === 'ACTIVE',
      onClick: () => {
        onStatusFilterChange?.(statusFilter === 'ACTIVE' ? 'ALL' : 'ACTIVE');
      },
    },
    {
      id: 'MANAGEMENT',
      title: t('users.statsManagement', { defaultValue: 'Boshqaruv xodimlari' }),
      shortTitle: t('users.statsManagementShort', { defaultValue: 'Boshqaruv' }),
      value: adminUsers,
      hint: t('users.statsManagementDesc', { defaultValue: 'Admin, menejer, operatorlar' }),
      icon: ShieldCheck,
      activeRing: 'border-aa-brand ring-1 ring-aa-brand aa-kpi-active-ring',
      isActive: roleFilter === 'MANAGEMENT',
      onClick: () => {
        onRoleFilterChange?.(roleFilter === 'MANAGEMENT' ? 'ALL' : 'MANAGEMENT');
      },
    },
    {
      id: 'STAFF',
      title: t('users.statsStaff', { defaultValue: 'Kassa va Operatsiya' }),
      shortTitle: t('users.statsStaffShort', { defaultValue: 'Xodimlar' }),
      value: staffUsers,
      hint: t('users.statsStaffDesc', { defaultValue: 'Kassa, zal va oshxona' }),
      icon: Store,
      activeRing: 'border-aa-brand ring-1 ring-aa-brand aa-kpi-active-ring',
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
            className={`aa-kpi relative p-3.5 sm:p-4 rounded-aa-lg bg-aa-surface border transition-all duration-200 shadow-none ${
              card.isActive
                ? card.activeRing
                : 'border-aa-line hover:border-aa-line-strong'
            } cursor-pointer hover:bg-aa-surface-hover hover:-translate-y-0.5`}
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <Icon size={16} className="text-aa-ink-muted shrink-0" aria-hidden="true" />
              <span className="aa-kpi__label truncate">
                <span className="sm:hidden">{card.shortTitle}</span>
                <span className="hidden sm:inline">{card.title}</span>
              </span>
            </div>

            <div className="mt-2 flex items-baseline gap-2">
              {isPending ? (
                <div className="h-7 w-16 bg-aa-surface-sunken rounded animate-pulse" />
              ) : (
                <span className="aa-kpi__value aa-num">
                  {card.value == null ? '—' : Number(card.value).toLocaleString('uz-UZ')}
                </span>
              )}
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

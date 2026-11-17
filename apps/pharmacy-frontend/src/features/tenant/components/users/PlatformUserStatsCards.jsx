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
      iconTile: 'ui-kpi-icon-primary',
      activeRing: 'ring-2 ring-primary-500 bg-primary-50/40 border-primary-300',
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
      iconTile: 'ui-kpi-icon-primary',
      activeRing: 'ring-2 ring-primary-500 bg-primary-50/40 border-primary-300',
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
      iconTile: 'ui-kpi-icon-primary',
      activeRing: 'ring-2 ring-primary-500 bg-primary-50/40 border-primary-300',
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
      iconTile: 'ui-kpi-icon-info',
      activeRing: 'ring-2 ring-primary-500 bg-primary-50/40 border-primary-300',
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
            className={`ui-card relative p-4 transition-all duration-150 ${
              card.isActive
                ? `${card.activeRing} border-2`
                : 'hover:border-line-strong'
            } cursor-pointer`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-xs font-medium uppercase tracking-wider text-ink-muted">
                {card.title}
              </span>
              <div className={card.iconTile}>
                <Icon size={18} strokeWidth={1.75} aria-hidden />
              </div>
            </div>

            <div className="mt-2 flex items-baseline gap-2">
              {isPending ? (
                <div className="h-8 w-16 rounded bg-canvas animate-pulse" />
              ) : (
                <span className="ui-tabular text-2xl sm:text-3xl font-bold tracking-tight text-ink">
                  {card.value.toLocaleString()}
                </span>
              )}
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

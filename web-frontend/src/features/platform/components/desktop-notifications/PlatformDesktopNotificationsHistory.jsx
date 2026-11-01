import React, { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import PlatformSelect from '../PlatformSelect';
import PlatformDesktopHistoryTable from './PlatformDesktopHistoryTable';
import PlatformDesktopHistoryMobileList from './PlatformDesktopHistoryMobileList';

export default function PlatformDesktopNotificationsHistory({ p }) {
  const { t } = p;
  const [activeMenuId, setActiveMenuId] = useState(null);

  const statusOptions = useMemo(
    () => [
      { value: 'ALL', label: t('platform.desktopNotifications.filterAll', { defaultValue: 'Barcha holatlar' }) },
      { value: 'ACTIVE', label: t('platform.desktopNotifications.filterActive', { defaultValue: 'Faol' }) },
      { value: 'SCHEDULED', label: t('platform.desktopNotifications.filterScheduled', { defaultValue: 'Rejalashtirilgan' }) },
      { value: 'EXPIRED', label: t('platform.desktopNotifications.filterExpired', { defaultValue: 'Muddati tugagan' }) },
    ],
    [t]
  );

  const handleRowClick = (item) => {
    p.setSelectedItemForDrawer?.(item);
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
      {/* Table Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {t('platform.desktopNotifications.historyTitle')}
          </h3>
          <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-xs font-bold text-slate-600 dark:text-slate-300">
            {p.history.length === p.totalHistoryCount
              ? p.totalHistoryCount
              : `${p.history.length} / ${p.totalHistoryCount}`}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Bar */}
          <div className="relative min-w-[220px] sm:min-w-[260px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={p.searchQuery}
              onChange={(e) => p.setSearchQuery(e.target.value)}
              placeholder={t('platform.desktopNotifications.searchPlaceholder')}
              aria-label={t('platform.desktopNotifications.searchPlaceholder')}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white transition-all"
            />
          </div>

          {/* Status Filter */}
          <div className="w-44 sm:w-48">
            <PlatformSelect
              options={statusOptions}
              value={p.statusFilter}
              onChange={(e) => p.setStatusFilter(e.target.value)}
              onValueChange={(val) => p.setStatusFilter(val)}
              size="sm"
              searchable={false}
              ariaLabel={t('platform.desktopNotifications.filterStatus', { defaultValue: 'Holat bo‘yicha filtr' })}
            />
          </div>
        </div>
      </div>

      {/* Desktop Table View */}
      <PlatformDesktopHistoryTable
        p={p}
        activeMenuId={activeMenuId}
        setActiveMenuId={setActiveMenuId}
        onRowClick={handleRowClick}
      />

      {/* Mobile Card List View (Touch-first, no horizontal scroll) */}
      <PlatformDesktopHistoryMobileList
        p={p}
        activeMenuId={activeMenuId}
        setActiveMenuId={setActiveMenuId}
        onRowClick={handleRowClick}
      />

      {/* Footnote */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50">
        <p className="text-[11px] text-slate-400 dark:text-slate-500">
          {t('platform.desktopNotifications.historyFootnote')}
        </p>
      </div>
    </section>
  );
}

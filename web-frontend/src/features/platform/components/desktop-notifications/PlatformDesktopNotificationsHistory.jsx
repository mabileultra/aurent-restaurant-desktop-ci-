import React, { useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ru, uz } from 'date-fns/locale';
import PlatformDesktopRowMenu from './PlatformDesktopRowMenu';

function resolveLocale(lang) {
  return lang?.startsWith('uz') ? uz : ru;
}

function formatDateFull(iso, lang) {
  try {
    const d = new Date(iso);
    const res = format(d, 'd-MMMM yyyy, HH:mm', { locale: resolveLocale(lang) });
    return lang?.startsWith('uz')
      ? res.replace(/-([A-ZА-ЯЁ][a-zа-яё]+)/g, (m, p1) => `-${p1.toLowerCase()}`)
      : res;
  } catch {
    return '—';
  }
}

function formatRelative(iso, lang) {
  try {
    const d = new Date(iso);
    const res = formatDistanceToNow(d, { addSuffix: true, locale: resolveLocale(lang) });
    return res.replace(/^(?:taxminan|tahminan)\s+/i, '');
  } catch {
    return '';
  }
}

export default function PlatformDesktopNotificationsHistory({ p }) {
  const { t, i18n } = p;
  const [activeMenuId, setActiveMenuId] = useState(null);

  const handleRowClick = (item) => {
    p.setSelectedItemForDrawer(item);
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
          <div className="relative">
            <select
              value={p.statusFilter}
              onChange={(e) => p.setStatusFilter(e.target.value)}
              className="appearance-none rounded-xl border border-slate-200 bg-slate-50/60 py-2 pl-3 pr-8 text-xs font-semibold text-slate-700 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer"
            >
              <option value="ALL">{t('platform.desktopNotifications.filterAll')}</option>
              <option value="ACTIVE">{t('platform.desktopNotifications.filterActive')}</option>
              <option value="SCHEDULED">{t('platform.desktopNotifications.filterScheduled')}</option>
              <option value="EXPIRED">{t('platform.desktopNotifications.filterExpired')}</option>
            </select>
            <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
        </div>
      </div>

      {/* Table Content (Desktop) */}
      <div className="hidden md:block overflow-x-auto min-h-[160px]">
        <table className="w-full text-left text-xs min-w-[760px]">
          <thead className="bg-slate-50/75 dark:bg-slate-850/75 text-[11px] font-bold tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-800">
            <tr>
              <th className="py-3 px-4">{t('platform.desktopNotifications.colSent')}</th>
              <th className="py-3 px-4">{t('platform.desktopNotifications.colKind')}</th>
              <th className="py-3 px-4">{t('platform.desktopNotifications.colMessage')}</th>
              <th className="py-3 px-4">{t('platform.desktopNotifications.colTarget')}</th>
              <th className="py-3 px-4">{t('platform.desktopNotifications.colDelivered')}</th>
              <th className="py-3 px-4">{t('platform.desktopNotifications.colRead')}</th>
              <th className="py-3 px-4">{t('platform.desktopNotifications.colStatus')}</th>
              <th className="py-3 px-3 text-right" aria-hidden />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {p.historyLoading ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-400">
                  {t('common.loading')}
                </td>
              </tr>
            ) : p.history.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-400">
                  {t('platform.desktopNotifications.historyEmpty')}
                </td>
              </tr>
            ) : (
              p.history.map((item) => {
                const kindStr = item.kind || 'MESSAGE';
                const isAlert = kindStr === 'ALERT';
                const isUpdate = kindStr === 'UPDATE';
                const isMessage = kindStr === 'MESSAGE';

                const progressWidth =
                  item.deliveredCount && item.totalCount
                    ? Math.min(100, Math.round((item.deliveredCount / item.totalCount) * 100))
                    : 0;

                return (
                  <tr
                    key={item.id}
                    onClick={() => handleRowClick(item)}
                    className="cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group"
                  >
                    {/* Sent Date */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {formatDateFull(item.createdAt, i18n.language)}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {formatRelative(item.createdAt, i18n.language)}
                      </p>
                    </td>

                    {/* Kind Badge */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {isAlert && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800">
                          {t('platform.desktopNotifications.kindAlert')}
                        </span>
                      )}
                      {isUpdate && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800">
                          {t('platform.desktopNotifications.kindUpdate')}
                        </span>
                      )}
                      {isMessage && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800">
                          {t('platform.desktopNotifications.kindMessage')}
                        </span>
                      )}
                    </td>

                    {/* Message Preview */}
                    <td className="py-3.5 px-4 max-w-[280px]">
                      <p className="font-bold text-slate-900 dark:text-white truncate">
                        {item.title}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {item.body}
                      </p>
                    </td>

                    {/* Target */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-700 dark:text-slate-300">
                      {item.targetLabel}
                    </td>

                    {/* Delivered */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {item.deliveredCount != null ? (
                        <div className="space-y-1 min-w-[120px]">
                          <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-600 rounded-full"
                              style={{ width: `${progressWidth}%` }}
                            />
                          </div>
                          <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                            {item.deliveredCount} / {item.totalCount} kassa
                          </p>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs">
                          {item.status === 'SCHEDULED'
                            ? t('platform.desktopNotifications.statusPending')
                            : t('platform.desktopNotifications.statusUntracked')}
                        </span>
                      )}
                    </td>

                    {/* Read */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {item.readCount != null ? (
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">
                            {item.readCount}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            ({item.readPercent}%)
                          </p>
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {item.status === 'ACTIVE' && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          <span>{t('platform.desktopNotifications.statusActive')}</span>
                        </span>
                      )}
                      {item.status === 'SCHEDULED' && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                          <span>{t('platform.desktopNotifications.statusScheduled')}</span>
                        </span>
                      )}
                      {item.status === 'EXPIRED' && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                          <span>{t('platform.desktopNotifications.statusExpired')}</span>
                        </span>
                      )}
                    </td>

                    {/* Action Dropdown Menu */}
                    <td className="py-3.5 px-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <PlatformDesktopRowMenu
                        item={item}
                        isOpen={activeMenuId === item.id}
                        onToggle={() => setActiveMenuId((prev) => (prev === item.id ? null : item.id))}
                        onClose={() => setActiveMenuId((prev) => (prev === item.id ? null : prev))}
                        onViewDetails={() => p.setSelectedItemForDrawer(item)}
                        onDuplicate={() => p.handleDuplicate(item)}
                        t={t}
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List View (Touch-first, no horizontal scroll) */}
      <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800">
        {p.historyLoading ? (
          <div className="py-8 text-center text-xs text-slate-400">
            {t('common.loading')}
          </div>
        ) : p.history.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            {t('platform.desktopNotifications.historyEmpty')}
          </div>
        ) : (
          p.history.map((item) => {
            const kindStr = item.kind || 'MESSAGE';
            const isAlert = kindStr === 'ALERT';
            const isUpdate = kindStr === 'UPDATE';
            const isMessage = kindStr === 'MESSAGE';

            return (
              <div
                key={item.id}
                role="button"
                tabIndex={0}
                aria-label={`${t('platform.desktopNotifications.drawerTitle')}: ${item.title}`}
                onClick={() => handleRowClick(item)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleRowClick(item);
                  }
                }}
                className="p-4 space-y-2.5 active:bg-slate-50 dark:active:bg-slate-800/60 cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {isAlert && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800">
                        {t('platform.desktopNotifications.kindAlert')}
                      </span>
                    )}
                    {isUpdate && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800">
                        {t('platform.desktopNotifications.kindUpdate')}
                      </span>
                    )}
                    {isMessage && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800">
                        {t('platform.desktopNotifications.kindMessage')}
                      </span>
                    )}
                    {item.status === 'ACTIVE' && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        <span>{t('platform.desktopNotifications.statusActive')}</span>
                      </span>
                    )}
                    {item.status === 'SCHEDULED' && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                        <span>{t('platform.desktopNotifications.statusScheduled')}</span>
                      </span>
                    )}
                    {item.status === 'EXPIRED' && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                        <span>{t('platform.desktopNotifications.statusExpired')}</span>
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <span className="text-[11px] text-slate-400">
                      {formatRelative(item.createdAt, i18n.language)}
                    </span>
                    <PlatformDesktopRowMenu
                      item={item}
                      isOpen={activeMenuId === `mobile-${item.id}`}
                      onToggle={() => setActiveMenuId((prev) => (prev === `mobile-${item.id}` ? null : `mobile-${item.id}`))}
                      onClose={() => setActiveMenuId((prev) => (prev === `mobile-${item.id}` ? null : prev))}
                      onViewDetails={() => p.setSelectedItemForDrawer(item)}
                      onDuplicate={() => p.handleDuplicate(item)}
                      t={t}
                    />
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                    {item.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                    {item.body}
                  </p>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
                  <span>{item.targetLabel || t('platform.desktopNotifications.targetAll')}</span>
                  <span className="font-medium text-slate-400">
                    {formatDateFull(item.createdAt, i18n.language)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footnote */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50">
        <p className="text-[11px] text-slate-400 dark:text-slate-500">
          {t('platform.desktopNotifications.historyFootnote')}
        </p>
      </div>
    </section>
  );
}

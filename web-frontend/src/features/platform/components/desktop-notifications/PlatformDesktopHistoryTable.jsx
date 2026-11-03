import React from 'react';
import PlatformDesktopRowMenu from './PlatformDesktopRowMenu';
import { formatDateFull, formatRelative } from './desktopNotificationFormatters';
import { NotificationKindBadge, NotificationStatusBadge } from './DesktopNotificationBadges';

export default function PlatformDesktopHistoryTable({
  p,
  activeMenuId,
  setActiveMenuId,
  onRowClick,
}) {
  const { t, i18n } = p;
  const isFilterEmpty = p.totalHistoryCount > 0 && p.history.length === 0;

  return (
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
                {isFilterEmpty
                  ? t('platform.desktopNotifications.noMatchingHistory', {
                      defaultValue: 'Mos keladigan xabarlar topilmadi',
                    })
                  : t('platform.desktopNotifications.historyEmpty')}
              </td>
            </tr>
          ) : (
            p.history.map((item) => {
              const progressWidth =
                item.deliveredCount && item.totalCount
                  ? Math.min(100, Math.round((item.deliveredCount / item.totalCount) * 100))
                  : 0;

              return (
                <tr
                  key={item.id}
                  onClick={() => onRowClick(item)}
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
                    <NotificationKindBadge kind={item.kind} t={t} size="sm" />
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
                    <NotificationStatusBadge status={item.status} t={t} size="sm" />
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
                      onExtend={() => (p.handleExtendPrompt ? p.handleExtendPrompt(item) : p.handleExtend(item))}
                      onRevoke={() => p.handleRevokePrompt(item)}
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
  );
}

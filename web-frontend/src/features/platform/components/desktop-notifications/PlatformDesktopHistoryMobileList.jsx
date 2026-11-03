import React from 'react';
import PlatformDesktopRowMenu from './PlatformDesktopRowMenu';
import { formatDateFull, formatRelative } from './desktopNotificationFormatters';
import { NotificationKindBadge, NotificationStatusBadge } from './DesktopNotificationBadges';

export default function PlatformDesktopHistoryMobileList({
  p,
  activeMenuId,
  setActiveMenuId,
  onRowClick,
}) {
  const { t, i18n } = p;
  const isFilterEmpty = p.totalHistoryCount > 0 && p.history.length === 0;

  return (
    <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800">
      {p.historyLoading ? (
        <div className="py-8 text-center text-xs text-slate-400">
          {t('common.loading')}
        </div>
      ) : p.history.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-400">
          {isFilterEmpty
            ? t('platform.desktopNotifications.noMatchingHistory', {
                defaultValue: 'Mos keladigan xabarlar topilmadi',
              })
            : t('platform.desktopNotifications.historyEmpty')}
        </div>
      ) : (
        p.history.map((item) => (
          <div
            key={item.id}
            role="button"
            tabIndex={0}
            aria-label={`${t('platform.desktopNotifications.drawerTitle')}: ${item.title}`}
            onClick={() => onRowClick(item)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onRowClick(item);
              }
            }}
            className="p-4 space-y-2.5 active:bg-slate-50 dark:active:bg-slate-800/60 cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <NotificationKindBadge kind={item.kind} t={t} size="xs" />
                <NotificationStatusBadge status={item.status} t={t} size="xs" />
              </div>
              <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                <span className="text-[11px] text-slate-400">
                  {formatRelative(item.createdAt, i18n.language)}
                </span>
                <PlatformDesktopRowMenu
                  item={item}
                  isOpen={activeMenuId === `mobile-${item.id}`}
                  onToggle={() =>
                    setActiveMenuId((prev) =>
                      prev === `mobile-${item.id}` ? null : `mobile-${item.id}`
                    )
                  }
                  onClose={() =>
                    setActiveMenuId((prev) =>
                      prev === `mobile-${item.id}` ? null : prev
                    )
                  }
                  onViewDetails={() => p.setSelectedItemForDrawer(item)}
                  onDuplicate={() => p.handleDuplicate(item)}
                  onExtend={() => (p.handleExtendPrompt ? p.handleExtendPrompt(item) : p.handleExtend(item))}
                  onRevoke={() => p.handleRevokePrompt(item)}
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
        ))
      )}
    </div>
  );
}

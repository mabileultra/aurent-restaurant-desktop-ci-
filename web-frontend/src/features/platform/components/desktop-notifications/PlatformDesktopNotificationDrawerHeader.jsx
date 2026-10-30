import React from 'react';
import { X } from 'lucide-react';
import { NotificationKindBadge, NotificationStatusBadge } from './DesktopNotificationBadges';

export default function PlatformDesktopNotificationDrawerHeader({
  item,
  formattedCreated,
  closeBtnRef,
  onClose,
  t,
}) {
  return (
    <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <NotificationKindBadge kind={item.kind} t={t} size="sm" />
          <NotificationStatusBadge status={item.status} t={t} size="sm" />
        </div>

        <button
          ref={closeBtnRef}
          type="button"
          onClick={onClose}
          className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
          aria-label={t('common.close', { defaultValue: 'Yopish' })}
        >
          <X size={20} />
        </button>
      </div>

      <h2
        id="desktop-notif-drawer-title"
        className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-3"
      >
        {item.title}
      </h2>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
        {t('platform.desktopNotifications.drawerSentBy', { date: formattedCreated })}
      </p>
    </div>
  );
}

import React from 'react';

/**
 * Single source of truth for notification kind badge (ALERT, UPDATE, MESSAGE).
 * Avoids duplicate JSX across table rows and mobile card views.
 */
export function NotificationKindBadge({ kind, t, size = 'sm' }) {
  const kindStr = kind || 'MESSAGE';
  const isAlert = kindStr === 'ALERT';
  const isUpdate = kindStr === 'UPDATE';
  const isMessage = kindStr === 'MESSAGE';

  const sizeClass = size === 'xs' ? 'text-[10px] px-2 py-0.5' : 'text-[11px] px-2 py-0.5';

  if (isAlert) {
    return (
      <span className={`inline-flex items-center rounded-md font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800 ${sizeClass}`}>
        {t('platform.desktopNotifications.kindAlert')}
      </span>
    );
  }

  if (isUpdate) {
    return (
      <span className={`inline-flex items-center rounded-md font-semibold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800 ${sizeClass}`}>
        {t('platform.desktopNotifications.kindUpdate')}
      </span>
    );
  }

  if (isMessage) {
    return (
      <span className={`inline-flex items-center rounded-md font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800 ${sizeClass}`}>
        {t('platform.desktopNotifications.kindMessage')}
      </span>
    );
  }

  return null;
}

/**
 * Single source of truth for notification status badge (ACTIVE, SCHEDULED, EXPIRED).
 */
export function NotificationStatusBadge({ status, t, size = 'sm' }) {
  const sizeClass = size === 'xs' ? 'text-[11px] gap-1' : 'text-xs gap-1.5';

  if (status === 'ACTIVE') {
    return (
      <span className={`inline-flex items-center font-semibold text-emerald-700 dark:text-emerald-400 ${sizeClass}`}>
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        <span>{t('platform.desktopNotifications.statusActive')}</span>
      </span>
    );
  }

  if (status === 'SCHEDULED') {
    return (
      <span className={`inline-flex items-center font-semibold text-blue-600 dark:text-blue-400 ${sizeClass}`}>
        <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
        <span>{t('platform.desktopNotifications.statusScheduled')}</span>
      </span>
    );
  }

  if (status === 'EXPIRED') {
    return (
      <span className={`inline-flex items-center font-semibold text-slate-500 dark:text-slate-400 ${sizeClass}`}>
        <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
        <span>{t('platform.desktopNotifications.statusExpired')}</span>
      </span>
    );
  }

  return null;
}

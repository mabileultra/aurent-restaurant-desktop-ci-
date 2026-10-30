import React from 'react';
import { Clock, Copy, Trash2 } from 'lucide-react';

/**
 * Action footer for desktop notification drawer.
 * Handles duplicate, extend (+24h) and revoke prompts with active state guards.
 */
export default function PlatformDesktopNotificationDrawerFooter({
  item,
  p,
  t,
}) {
  const isExpired = item?.status === 'EXPIRED';

  return (
    <div className="border-t border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 space-y-2 shrink-0">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => p.handleDuplicate(item)}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-750 transition-colors cursor-pointer"
        >
          <Copy size={15} />
          <span>{t('platform.desktopNotifications.actionDuplicate')}</span>
        </button>

        <button
          type="button"
          disabled={isExpired}
          onClick={() => {
            if (isExpired) return;
            p.handleExtend(item);
          }}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl border py-2.5 text-xs font-semibold transition-colors ${
            isExpired
              ? 'border-slate-200 bg-slate-100 text-slate-400 dark:border-slate-800 dark:bg-slate-850 dark:text-slate-500 cursor-not-allowed opacity-60'
              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-750 cursor-pointer'
          }`}
        >
          <Clock size={15} />
          <span>{t('platform.desktopNotifications.actionExtend24h', { defaultValue: 'Muddatni uzaytirish (+24 soat)' })}</span>
        </button>
      </div>

      <button
        type="button"
        disabled={isExpired}
        onClick={() => {
          if (isExpired) return;
          p.handleRevokePrompt(item);
        }}
        className={`flex w-full items-center justify-center gap-1.5 rounded-xl border py-2.5 text-xs font-semibold transition-colors ${
          isExpired
            ? 'border-slate-200 bg-slate-100 text-slate-400 dark:border-slate-800 dark:bg-slate-850 dark:text-slate-500 cursor-not-allowed opacity-60'
            : 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-900/40 cursor-pointer'
        }`}
      >
        <Trash2 size={15} />
        <span>{t('platform.desktopNotifications.actionRevoke', { defaultValue: 'Kassalardan olib tashlash' })}</span>
      </button>
    </div>
  );
}

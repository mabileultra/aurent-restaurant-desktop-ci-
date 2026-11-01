import React from 'react';
import { Bell } from 'lucide-react';

export default function PlatformDesktopFormFooter({ p, canSend }) {
  const { t } = p;
  const isSelect = p.targetScope === 'SELECT';

  let sendBtnLabel;
  if (isSelect) {
    sendBtnLabel = t('platform.desktopNotifications.sendBtnSelected', {
      defaultValue: 'Tanlanganlarga yuborish',
    });
  } else if (p.activeCount != null) {
    sendBtnLabel = t('platform.desktopNotifications.sendBtn', { count: p.activeCount });
  } else {
    sendBtnLabel = t('platform.desktopNotifications.sendBtnAll', {
      defaultValue: 'Barcha kassalarga yuborish',
    });
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100 pt-3 sm:pt-4 dark:border-slate-800">
      <div className="min-h-[1.25rem]">
        {!canSend && p.sendDisabledReason && (
          <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">
            {p.sendDisabledReason}
          </p>
        )}
      </div>
      <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2.5">
        <button
          type="button"
          onClick={p.handleClear}
          className="w-full sm:w-auto rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-750 transition-colors cursor-pointer text-center"
        >
          {t('platform.desktopNotifications.clearBtn')}
        </button>
        <button
          type="button"
          onClick={p.handleSend}
          disabled={!canSend}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-800 focus:ring-2 focus:ring-emerald-600/30 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-normal text-center"
        >
          <Bell size={15} className="shrink-0" />
          <span>{sendBtnLabel}</span>
        </button>
      </div>
    </div>
  );
}

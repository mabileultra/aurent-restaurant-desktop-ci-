import React from 'react';

export default function PlatformDesktopConfirmModalSummary({
  t,
  targetLabel,
  isAlert,
  isUpdate,
  visibleUntilFormatted,
  scheduleType,
  scheduledFormatted,
  activeTitle,
  activeBody,
}) {
  return (
    <>
      <div className="divide-y divide-slate-100 dark:divide-slate-800 border-y border-slate-100 dark:border-slate-800 text-xs">
        <div className="flex items-center justify-between py-2.5">
          <span className="text-slate-500 dark:text-slate-400">
            {t('platform.desktopNotifications.confirmLabelTarget')}
          </span>
          <span className="font-semibold text-slate-900 dark:text-white">
            {targetLabel}
          </span>
        </div>

        <div className="flex items-center justify-between py-2.5">
          <span className="text-slate-500 dark:text-slate-400">
            {t('platform.desktopNotifications.confirmLabelKind')}
          </span>
          <div className="flex items-center gap-1.5">
            {isAlert && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800">
                {t('platform.desktopNotifications.kindAlert')}
              </span>
            )}
            {isUpdate && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800">
                {t('platform.desktopNotifications.kindUpdate')}
              </span>
            )}
            {!isAlert && !isUpdate && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800">
                {t('platform.desktopNotifications.kindMessage')}
              </span>
            )}
            <span className="text-slate-600 dark:text-slate-400 text-[11px]">
              {isAlert ? 'kassir yopmaguncha ekranda turadi' : 'bildirishnomalarda chiqadi'}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between py-2.5">
          <span className="text-slate-500 dark:text-slate-400">
            {t('platform.desktopNotifications.confirmLabelExpires')}
          </span>
          <span className="font-semibold text-slate-900 dark:text-white">
            {visibleUntilFormatted} gacha
          </span>
        </div>

        <div className="flex items-center justify-between py-2.5">
          <span className="text-slate-500 dark:text-slate-400">
            {t('platform.desktopNotifications.confirmLabelSendTime')}
          </span>
          <span className="font-semibold text-slate-900 dark:text-white">
            {scheduleType === 'NOW' ? 'Hozir' : (scheduledFormatted || 'Rejalashtirilgan')}
          </span>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 dark:border-slate-800 dark:bg-slate-850 space-y-1">
        <p className="text-[11px] font-semibold text-slate-400">
          {t('platform.desktopNotifications.confirmCashierPreview')}
        </p>
        <h4 className="text-xs font-bold text-slate-900 dark:text-white">
          {activeTitle}
        </h4>
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3">
          {activeBody}
        </p>
      </div>

      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
        {t('platform.desktopNotifications.confirmFootnote')}
      </p>
    </>
  );
}

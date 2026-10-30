import React from 'react';
import {
  AlertTriangle,
  Bell,
  Check,
  CheckCircle2,
  Info,
  RefreshCw,
} from 'lucide-react';

export default function PlatformDesktopLivePreview({ p }) {
  const { t } = p;
  const isUzPreview = p.previewLang === 'uz';

  const previewTitle = isUzPreview ? p.titleUz : p.titleRu || p.titleUz;
  const previewBody = isUzPreview ? p.bodyUz : p.bodyRu || p.bodyUz;

  const hasTitle = Boolean(previewTitle?.trim());
  const hasBody = Boolean(previewBody?.trim());

  const displayTitle = hasTitle
    ? previewTitle.trim()
    : t('platform.desktopNotifications.titleEmptyFallback', { defaultValue: 'Sarlavha' });
  const displayBody = hasBody
    ? previewBody.trim()
    : t('platform.desktopNotifications.bodyEmptyFallback', { defaultValue: 'Xabar matni kiritilmagan...' });

  const isAlert = p.kind === 'ALERT';
  const isUpdate = p.kind === 'UPDATE';
  const isMessage = p.kind === 'MESSAGE';

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-3.5 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4 sm:space-y-5">
      {/* Header with Language Selector */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
        <h3 className="text-xs font-bold text-slate-900 dark:text-white">
          {t('platform.desktopNotifications.livePreviewTitle')}
        </h3>

        <div className="inline-flex rounded-lg bg-slate-100 p-0.5 dark:bg-slate-800 text-[11px] font-semibold">
          <button
            type="button"
            onClick={() => p.setPreviewLang('uz')}
            className={`rounded-md px-2.5 py-1 transition-all ${
              isUzPreview
                ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            {t('platform.desktopNotifications.previewUz')}
          </button>
          <button
            type="button"
            onClick={() => p.setPreviewLang('ru')}
            className={`rounded-md px-2.5 py-1 transition-all ${
              !isUzPreview
                ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            {t('platform.desktopNotifications.previewRu')}
          </button>
        </div>
      </div>

      {/* Simulated Desktop Cashier Monitor */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 shadow-xl flex flex-col justify-between min-h-[360px] select-none">
        {/* Cashier Screen Top Bar */}
        <div className="flex items-center justify-between px-3.5 py-2 bg-slate-900/95 border-b border-slate-800 text-white z-10">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-xs font-bold tracking-tight">Aurent Kassa</span>
          </div>
          <div className="flex items-center gap-2.5 text-[11px] text-slate-300">
            <div className={`relative flex items-center p-1 rounded ${!isAlert ? 'bg-slate-800 text-white ring-1 ring-emerald-500/50' : 'text-slate-300'}`}>
              <Bell size={13} className={!isAlert ? 'text-emerald-400' : 'text-slate-300'} />
              <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-rose-500 text-[8px] font-bold text-white">
                1
              </span>
            </div>
            <span className="font-mono text-slate-400">14:30</span>
          </div>
        </div>

        {/* Blurred Simulated POS Background (Shelves / Catalog / Cart silhouette) */}
        <div className="absolute inset-0 pt-9 p-3 flex gap-3 opacity-25 filter blur-[2px] pointer-events-none">
          <div className="flex-1 space-y-2">
            <div className="h-6 w-full rounded bg-slate-700" />
            <div className="grid grid-cols-3 gap-2 pt-1">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-14 rounded-lg bg-slate-800" />
              ))}
            </div>
          </div>
          <div className="w-28 rounded-lg bg-slate-800 p-2 space-y-1.5">
            <div className="h-3 w-3/4 rounded bg-slate-700" />
            <div className="h-3 w-1/2 rounded bg-slate-700" />
            <div className="h-8 w-full rounded bg-emerald-900/50 mt-12" />
          </div>
        </div>

        {/* Case 1: ALERT (Centered Cashier Pop-up Modal with full backdrop blur) */}
        {isAlert && (
          <>
            <div className="absolute inset-0 pt-9 bg-slate-950/60 backdrop-blur-[1px]" />
            <div className="relative z-10 m-auto w-full max-w-[270px] sm:max-w-[290px] rounded-2xl bg-white p-5 shadow-2xl dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-center space-y-3 animate-in zoom-in-95 duration-200">
              <div className="flex justify-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-50 text-amber-600 dark:bg-amber-950/70 dark:text-amber-400">
                  <AlertTriangle size={20} />
                </div>
              </div>

              <div className="space-y-1">
                <h4
                  className={`text-xs sm:text-sm leading-snug break-words ${
                    hasTitle ? 'font-bold text-slate-900 dark:text-white' : 'font-normal italic text-slate-400 dark:text-slate-500'
                  }`}
                >
                  {displayTitle}
                </h4>
                <p
                  className={`text-[11px] leading-relaxed break-words line-clamp-4 ${
                    hasBody ? 'text-slate-600 dark:text-slate-300' : 'italic text-slate-400 dark:text-slate-500'
                  }`}
                >
                  {displayBody}
                </p>
              </div>

              <div className="pt-1">
                <div className="rounded-xl bg-[#a33719] py-2 px-3 text-xs font-semibold text-white shadow-xs">
                  {t('platform.desktopNotifications.previewDismissBtn', { lng: p.previewLang })}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Case 2: MESSAGE or UPDATE (Top-right Bell Notification Flyout Toast) */}
        {!isAlert && (
          <div className="absolute top-10 right-2.5 z-20 w-[240px] sm:w-[260px] rounded-2xl bg-white p-3.5 shadow-2xl border border-slate-200 dark:bg-slate-900 dark:border-slate-750 text-left space-y-2 animate-in slide-in-from-top-2 duration-150">
            {/* Flyout Card Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {isUpdate ? (
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-50 text-blue-600 dark:bg-blue-950/70 dark:text-blue-400">
                    <RefreshCw size={13} />
                  </div>
                ) : (
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-50 text-emerald-600 dark:bg-emerald-950/70 dark:text-emerald-400">
                    <Bell size={13} />
                  </div>
                )}
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  {isUpdate ? t('platform.desktopNotifications.kindUpdate') : t('platform.desktopNotifications.kindMessage')}
                </span>
              </div>
              <span className="text-[10px] text-slate-400">14:30</span>
            </div>

            {/* Flyout Content */}
            <div className="space-y-0.5">
              <h4
                className={`text-xs leading-snug break-words ${
                  hasTitle ? 'font-bold text-slate-900 dark:text-white' : 'font-normal italic text-slate-400 dark:text-slate-500'
                }`}
              >
                {displayTitle}
              </h4>
              <p
                className={`text-[11px] leading-relaxed break-words line-clamp-3 ${
                  hasBody ? 'text-slate-600 dark:text-slate-300' : 'italic text-slate-400 dark:text-slate-500'
                }`}
              >
                {displayBody}
              </p>
            </div>

            {/* Flyout Footer */}
            {isUpdate ? (
              <div className="pt-1.5 flex justify-end">
                <div className="rounded-lg bg-blue-600 py-1 px-2.5 text-[11px] font-semibold text-white shadow-xs">
                  {t('platform.desktopNotifications.previewUpdateBtn', { lng: p.previewLang })}
                </div>
              </div>
            ) : (
              <div className="pt-1 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                <span>{isUzPreview ? "Qo'ng'iroqcha ro'yxatida" : 'В списке уведомлений'}</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">● {isUzPreview ? 'Yangi' : 'Новое'}</span>
              </div>
            )}
          </div>
        )}

        {/* Empty bottom space spacer */}
        <div className="h-2 z-10" />
      </div>

      {/* Pre-Send Summary Checklist Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-2.5 text-xs">
        <h4 className="font-bold text-slate-900 dark:text-white">
          {t('platform.desktopNotifications.preSendTitle')}
        </h4>

        <div className="space-y-2 text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed">
          <div className="flex items-start gap-2">
            <Check size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <span>
              {p.totalRegistersCount != null
                ? t('platform.desktopNotifications.preSendCountCheck', { count: p.totalRegistersCount })
                : t('platform.desktopNotifications.sendBtnAll', { defaultValue: 'Barcha kassalarga yuborish' })}
            </span>
          </div>

          <div className="flex items-start gap-2 text-slate-500 dark:text-slate-400">
            <Info size={14} className="text-slate-400 shrink-0 mt-0.5" />
            <span>
              {p.kind === 'ALERT' && t('platform.desktopNotifications.preSendAlertNote')}
              {p.kind === 'UPDATE' && t('platform.desktopNotifications.preSendUpdateNote')}
              {p.kind === 'MESSAGE' && t('platform.desktopNotifications.preSendMessageNote')}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

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

  const displayTitle = previewTitle.trim() || t('platform.desktopNotifications.titlePlaceholder');
  const displayBody = previewBody.trim() || t('platform.desktopNotifications.bodyPlaceholder');

  const isRuFilled = Boolean(p.titleRu.trim() && p.bodyRu.trim());

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-5">
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
            <div className="relative flex items-center">
              <Bell size={13} className="text-slate-300" />
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

        {/* Backdrop Tint */}
        <div className="absolute inset-0 pt-9 bg-slate-950/60 backdrop-blur-[1px]" />

        {/* Centered Cashier Alert Pop-up Modal */}
        <div className="relative z-10 m-auto w-full max-w-[270px] sm:max-w-[290px] rounded-2xl bg-white p-5 shadow-2xl dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-center space-y-3 animate-in zoom-in-95 duration-200">
          {/* Kind Icon Badge */}
          <div className="flex justify-center">
            {p.kind === 'ALERT' && (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-50 text-amber-600 dark:bg-amber-950/70 dark:text-amber-400">
                <AlertTriangle size={20} />
              </div>
            )}
            {p.kind === 'UPDATE' && (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950/70 dark:text-blue-400">
                <RefreshCw size={20} />
              </div>
            )}
            {p.kind === 'MESSAGE' && (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/70 dark:text-emerald-400">
                <Bell size={20} />
              </div>
            )}
          </div>

          {/* Title & Body */}
          <div className="space-y-1">
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-snug break-words">
              {displayTitle}
            </h4>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed break-words line-clamp-4">
              {displayBody}
            </p>
          </div>

          {/* Simulated Button */}
          <div className="pt-1">
            {p.kind === 'ALERT' && (
              <div className="rounded-xl bg-[#a33719] py-2 px-3 text-xs font-semibold text-white shadow-xs">
                {t('platform.desktopNotifications.previewDismissBtn')}
              </div>
            )}
            {p.kind === 'UPDATE' && (
              <div className="rounded-xl bg-blue-600 py-2 px-3 text-xs font-semibold text-white shadow-xs">
                {t('platform.desktopNotifications.previewUpdateBtn')}
              </div>
            )}
            {p.kind === 'MESSAGE' && (
              <div className="rounded-xl bg-slate-800 py-2 px-3 text-xs font-semibold text-white shadow-xs">
                {t('platform.desktopNotifications.previewCloseBtn')}
              </div>
            )}
          </div>
        </div>

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
            <span>{t('platform.desktopNotifications.preSendCountCheck', { count: p.totalRegistersCount })}</span>
          </div>

          {isRuFilled ? (
            <div className="flex items-start gap-2">
              <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <span className="text-emerald-800 dark:text-emerald-300 font-medium">
                {t('platform.desktopNotifications.preSendRuFilled')}
              </span>
            </div>
          ) : (
            <div className="flex items-start gap-2 rounded-xl border border-amber-200/80 bg-amber-50/80 p-2.5 dark:border-amber-900/50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200">
              <Info size={14} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <span>{t('platform.desktopNotifications.preSendRuMissing')}</span>
            </div>
          )}

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

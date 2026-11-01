import React from 'react';
import { AlertTriangle } from 'lucide-react';

export default function PlatformDesktopLivePreviewAlert({
  displayTitle,
  displayBody,
  hasTitle,
  hasBody,
  previewLang,
  t,
}) {
  return (
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
              hasTitle
                ? 'font-bold text-slate-900 dark:text-white'
                : 'font-normal italic text-slate-400 dark:text-slate-500'
            }`}
          >
            {displayTitle}
          </h4>
          <p
            className={`text-[11px] leading-relaxed break-words line-clamp-4 ${
              hasBody
                ? 'text-slate-600 dark:text-slate-300'
                : 'italic text-slate-400 dark:text-slate-500'
            }`}
          >
            {displayBody}
          </p>
        </div>

        <div className="pt-1">
          <div className="rounded-xl bg-[#a33719] py-2 px-3 text-xs font-semibold text-white shadow-xs">
            {t('platform.desktopNotifications.previewDismissBtn', { lng: previewLang })}
          </div>
        </div>
      </div>
    </>
  );
}

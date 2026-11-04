import React from 'react';

export const MAX_BROADCAST_TITLE_LENGTH = 200;
export const MAX_BROADCAST_BODY_LENGTH = 4000;

export default function PlatformDesktopContentStep({ p }) {
  const { t } = p;
  const currentTitle = p.title || '';
  const currentBody = p.body || '';

  return (
    <div className="space-y-2.5 sm:space-y-3">
      <div className="flex items-center gap-2">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50 text-xs font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
          2
        </span>
        <h3 className="text-xs font-bold text-slate-900 dark:text-white">
          {t('platform.desktopNotifications.stepContent')}
        </h3>
      </div>

      {/* Title Field (Max 200 chars matching backend) */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
          <label htmlFor="broadcast-title-input">
            {t('platform.desktopNotifications.fieldTitle')} <span className="text-rose-500">*</span>
          </label>
          <span className="text-[11px] font-normal text-slate-400">
            {currentTitle.length}/{MAX_BROADCAST_TITLE_LENGTH}
          </span>
        </div>
        <input
          id="broadcast-title-input"
          type="text"
          maxLength={MAX_BROADCAST_TITLE_LENGTH}
          value={currentTitle}
          onChange={(e) => p.setTitle(e.target.value)}
          placeholder={t('platform.desktopNotifications.titlePlaceholder')}
          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-800 dark:bg-slate-850 dark:text-white"
        />
      </div>

      {/* Body Field (Max 4000 chars matching backend) */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
          <label htmlFor="broadcast-body-input">
            {t('platform.desktopNotifications.fieldBody')} <span className="text-rose-500">*</span>
          </label>
          <span className="text-[11px] font-normal text-slate-400">
            {currentBody.length}/{MAX_BROADCAST_BODY_LENGTH}
          </span>
        </div>
        <textarea
          id="broadcast-body-input"
          rows={4}
          maxLength={MAX_BROADCAST_BODY_LENGTH}
          value={currentBody}
          onChange={(e) => p.setBody(e.target.value)}
          placeholder={t('platform.desktopNotifications.bodyPlaceholder')}
          className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-800 dark:bg-slate-850 dark:text-white leading-relaxed resize-none"
        />
      </div>
    </div>
  );
}

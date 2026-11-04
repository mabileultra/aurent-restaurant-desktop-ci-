import React from 'react';
import { Clock } from 'lucide-react';

export default function PlatformDesktopDurationPicker({ p }) {
  const { t } = p;

  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
        {t('platform.desktopNotifications.visibleDuration')}
      </label>
      <div className="flex flex-wrap items-center gap-1.5" role="group">
        {[
          { id: '1d', label: t('platform.desktopNotifications.duration1d') },
          { id: '3d', label: t('platform.desktopNotifications.duration3d') },
          { id: '1w', label: t('platform.desktopNotifications.duration1w') },
          { id: 'other', label: t('platform.desktopNotifications.durationOther') },
        ].map((btn) => (
          <button
            key={btn.id}
            type="button"
            aria-pressed={p.duration === btn.id}
            onClick={() => p.setDuration(btn.id)}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold border transition-all cursor-pointer ${
              p.duration === btn.id
                ? 'border-emerald-600 bg-emerald-50 text-emerald-700 dark:border-emerald-500 dark:bg-emerald-950/60 dark:text-emerald-300 shadow-xs'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {p.duration === 'other' && (
        <div className="space-y-1.5 pt-1">
          <label
            htmlFor="desktop-custom-hours-input"
            className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
          >
            {t('platform.desktopNotifications.customHoursLabel', { defaultValue: 'Muddat (soatda)' })}
          </label>
          <div className="flex items-center gap-2">
            <input
              id="desktop-custom-hours-input"
              type="number"
              min="1"
              max="720"
              value={p.customHours}
              onChange={(e) => p.setCustomHours(e.target.value)}
              placeholder={t('platform.desktopNotifications.customHoursPlaceholder', { defaultValue: 'Masalan: 48' })}
              aria-label={t('platform.desktopNotifications.customHoursLabel', { defaultValue: 'Muddat (soatda)' })}
              aria-invalid={p.isCustomHoursValid === false}
              aria-describedby={p.isCustomHoursValid === false ? 'desktop-custom-hours-error' : undefined}
              className={`w-28 rounded-xl border bg-white px-3 py-1.5 text-xs text-slate-900 outline-none transition-all dark:bg-slate-850 dark:text-white ${
                p.isCustomHoursValid === false
                  ? 'border-rose-500 focus:ring-1 focus:ring-rose-500/30'
                  : 'border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 dark:border-slate-700'
              }`}
            />
            <span className="text-xs text-slate-500 dark:text-slate-400">soat</span>
          </div>
          {p.isCustomHoursValid === false && (
            <p id="desktop-custom-hours-error" role="alert" className="text-[11px] font-medium text-rose-600 dark:text-rose-400">
              {t('platform.desktopNotifications.customHoursError', {
                defaultValue: "Muddat 1 dan 720 soatgacha (30 kun) oralig'ida bo'lishi kerak",
              })}
            </p>
          )}
        </div>
      )}

      {p.visibleUntilFormatted ? (
        <p className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
          <Clock size={12} className="text-slate-400" />
          <span>{t('platform.desktopNotifications.visibleUntil', { date: p.visibleUntilFormatted })}</span>
        </p>
      ) : null}
    </div>
  );
}

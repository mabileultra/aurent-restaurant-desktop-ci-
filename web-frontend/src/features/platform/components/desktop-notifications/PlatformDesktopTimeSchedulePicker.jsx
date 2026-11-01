import React, { useMemo } from 'react';
import { Calendar } from 'lucide-react';
import PlatformDatePicker from '../PlatformDatePicker';
import PlatformTimePicker from '../PlatformTimePicker';

export default function PlatformDesktopTimeSchedulePicker({ p }) {
  const { t } = p;
  const isScheduled = p.scheduleType === 'SCHEDULED';
  const todayIso = useMemo(() => new Date().toISOString().slice(0, 10), []);

  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
        {t('platform.desktopNotifications.sendTime')}
      </label>
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() => p.setScheduleType('NOW')}
          aria-pressed={!isScheduled}
          className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold border transition-all cursor-pointer ${
            !isScheduled
              ? 'border-emerald-600 bg-emerald-50 text-emerald-700 dark:border-emerald-500 dark:bg-emerald-950/60 dark:text-emerald-300 shadow-xs'
              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
          }`}
        >
          {t('platform.desktopNotifications.sendNow')}
        </button>
        <button
          type="button"
          onClick={() => p.setScheduleType('SCHEDULED')}
          aria-pressed={isScheduled}
          className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold border transition-all cursor-pointer ${
            isScheduled
              ? 'border-emerald-600 bg-emerald-50 text-emerald-700 dark:border-emerald-500 dark:bg-emerald-950/60 dark:text-emerald-300 shadow-xs'
              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
          }`}
        >
          <span>{t('platform.desktopNotifications.sendSchedule')}</span>
        </button>
      </div>

      {!isScheduled ? (
        <p className="text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
          {t('platform.desktopNotifications.sendNowNote')}
        </p>
      ) : (
        <div className="space-y-2 pt-1.5 rounded-xl border border-emerald-200/60 bg-emerald-50/20 p-2.5 dark:border-emerald-900/40 dark:bg-emerald-950/10">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex-1 min-w-[140px]">
              <PlatformDatePicker
                value={p.scheduleDate}
                onChange={(val) => p.setScheduleDate(val)}
                min={todayIso}
                placeholder={t('platform.desktopNotifications.scheduleDatePlaceholder', { defaultValue: 'Sana tanlang...' })}
              />
            </div>
            <PlatformTimePicker
              value={p.scheduleTime || '09:00'}
              onChange={(val) => p.setScheduleTime(val)}
              ariaLabel={t('platform.desktopNotifications.sendTime')}
            />
          </div>

          {/* Mutually exclusive schedule status/error messages: never show both red and green */}
          {p.isScheduleValid && p.scheduledFormatted ? (
            <p className="flex items-center gap-1.5 text-[11px] text-emerald-700 dark:text-emerald-400 font-medium pt-0.5">
              <Calendar size={12} className="shrink-0" />
              <span>
                {t('platform.desktopNotifications.scheduleAtFormatted', {
                  date: p.scheduledFormatted,
                  defaultValue: `${p.scheduledFormatted} da avtomatik yuboriladi`,
                })}
              </span>
            </p>
          ) : p.isScheduleValid === false && p.scheduleDate ? (
            <p role="alert" className="text-[11px] font-medium text-rose-600 dark:text-rose-400">
              {!p.isScheduleInFuture
                ? t('platform.desktopNotifications.scheduleFutureError', { defaultValue: 'Rejalashtirilgan vaqt kelajakda bo‘lishi kerak' })
                : t('platform.desktopNotifications.scheduleRequiredError', { defaultValue: 'Sana va vaqtni to‘liq belgilang' })}
            </p>
          ) : (
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {t('platform.desktopNotifications.schedulePrompt', { defaultValue: 'Xabar jo‘natilishi kerak bo‘lgan sana va vaqtni tanlang' })}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

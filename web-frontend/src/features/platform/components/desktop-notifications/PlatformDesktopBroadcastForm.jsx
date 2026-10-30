import React, { useRef } from 'react';
import {
  AlertTriangle,
  Bell,
  Check,
  Clock,
  MessageSquare,
  Monitor,
  RefreshCw,
  Send,
} from 'lucide-react';

const KIND_OPTIONS = [
  {
    id: 'MESSAGE',
    icon: MessageSquare,
    iconBg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300',
    titleKey: 'platform.desktopNotifications.kindMessage',
    descKey: 'platform.desktopNotifications.kindMessageDesc',
  },
  {
    id: 'UPDATE',
    icon: RefreshCw,
    iconBg: 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300',
    titleKey: 'platform.desktopNotifications.kindUpdate',
    descKey: 'platform.desktopNotifications.kindUpdateDesc',
  },
  {
    id: 'ALERT',
    icon: AlertTriangle,
    iconBg: 'bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300',
    titleKey: 'platform.desktopNotifications.kindAlert',
    descKey: 'platform.desktopNotifications.kindAlertDesc',
  },
];

const KINDS = KIND_OPTIONS.map((k) => k.id);

export default function PlatformDesktopBroadcastForm({ p }) {
  const { t } = p;

  const currentTitle = p.title || '';
  const currentBody = p.body || '';

  const canSend = p.canSend != null
    ? p.canSend
    : Boolean(currentTitle.trim() && currentBody.trim() && !p.sendPending && p.isCustomHoursValid !== false);

  const activeCount = p.activeRegistersCount ?? p.totalRegistersCount;
  const sendBtnLabel = activeCount != null
    ? t('platform.desktopNotifications.sendBtn', { count: activeCount })
    : t('platform.desktopNotifications.sendBtnAll', { defaultValue: 'Barcha kassalarga yuborish' });

  const kindRefs = {
    MESSAGE: useRef(null),
    UPDATE: useRef(null),
    ALERT: useRef(null),
  };

  const handleKindKeyDown = (e, currentKind) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      const currentIndex = KINDS.indexOf(currentKind);
      const nextIndex = (currentIndex + 1) % KINDS.length;
      const nextKind = KINDS[nextIndex];
      p.setKind(nextKind);
      kindRefs[nextKind]?.current?.focus();
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      const currentIndex = KINDS.indexOf(currentKind);
      const nextIndex = (currentIndex - 1 + KINDS.length) % KINDS.length;
      const nextKind = KINDS[nextIndex];
      p.setKind(nextKind);
      kindRefs[nextKind]?.current?.focus();
    }
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-3.5 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4 sm:space-y-6">
      {/* Form Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 sm:pb-4 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
            <Send size={18} />
          </div>
          <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
            {t('platform.desktopNotifications.broadcastTitle')}
          </h2>
        </div>

        {/* Draft Indicator or Restored Notice */}
        {p.isDraftRestored ? (
          <div className="inline-flex items-center gap-2 rounded-lg bg-amber-50 px-2.5 py-1 text-xs text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:border-amber-900 dark:text-amber-300">
            <span className="font-medium">
              {t('platform.desktopNotifications.draftRestoredNotice', { defaultValue: 'Qoralama tiklandi' })}
            </span>
            <span>·</span>
            <button
              type="button"
              onClick={p.handleClear}
              className="font-bold underline hover:text-amber-950 dark:hover:text-amber-100 cursor-pointer"
            >
              {t('platform.desktopNotifications.clearBtn', { defaultValue: 'Tozalash' })}
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span>{t('platform.desktopNotifications.draftSaved')}</span>
          </div>
        )}
      </div>

      {/* Step 1: Kimga */}
      <div className="space-y-2.5 sm:space-y-3">
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50 text-xs font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
            1
          </span>
          <h3 className="text-xs font-bold text-slate-900 dark:text-white">
            {t('platform.desktopNotifications.stepTarget')}
          </h3>
        </div>

        <div className="inline-flex items-center rounded-xl bg-slate-100 p-1 dark:bg-slate-800/80">
          <button
            type="button"
            aria-pressed="true"
            className="rounded-lg px-3.5 py-1.5 text-xs font-semibold bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white transition-all cursor-default"
          >
            {t('platform.desktopNotifications.targetAll')}
          </button>
          <button
            type="button"
            disabled
            aria-pressed="false"
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-400 dark:text-slate-500 opacity-60 cursor-not-allowed transition-all"
            title={t('platform.desktopNotifications.comingSoon', { defaultValue: 'Tez kunda' })}
          >
            <span>{t('platform.desktopNotifications.targetSelect')}</span>
            <span className="rounded bg-slate-200 px-1.5 py-0.2 text-[10px] font-semibold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
              {t('platform.desktopNotifications.comingSoon', { defaultValue: 'Tez kunda' })}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-850">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-600 shadow-xs dark:bg-slate-800 dark:text-slate-300">
            <Monitor size={17} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-900 dark:text-white">
              {activeCount != null
                ? `${t('platform.desktopNotifications.registersCount', { count: activeCount })}${
                    p.onlineRegistersCount != null ? ` · ${t('platform.desktopNotifications.onlineCount', { defaultValue: `Hozir onlayn: ${p.onlineRegistersCount}` })}` : ''
                  }`
                : t('platform.desktopNotifications.registersCountUnknown', { defaultValue: 'Noma‘lum (barcha faol kassalar)' })}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {t('platform.desktopNotifications.allCompaniesOfflineNote')}
            </p>
          </div>
        </div>
      </div>

      {/* Step 2: Xabar matni */}
      <div className="space-y-2.5 sm:space-y-3">
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50 text-xs font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
            2
          </span>
          <h3 className="text-xs font-bold text-slate-900 dark:text-white">
            {t('platform.desktopNotifications.stepContent')}
          </h3>
        </div>

        {/* Title Field */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
            <label htmlFor="broadcast-title-input">
              {t('platform.desktopNotifications.fieldTitle')} <span className="text-rose-500">*</span>
            </label>
            <span className="text-[11px] font-normal text-slate-400">
              {currentTitle.length}/60
            </span>
          </div>
          <input
            id="broadcast-title-input"
            type="text"
            maxLength={60}
            value={currentTitle}
            onChange={(e) => p.setTitle(e.target.value)}
            placeholder={t('platform.desktopNotifications.titlePlaceholder')}
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-800 dark:bg-slate-850 dark:text-white"
          />
        </div>

        {/* Body Field */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
            <label htmlFor="broadcast-body-input">
              {t('platform.desktopNotifications.fieldBody')} <span className="text-rose-500">*</span>
            </label>
            <span className="text-[11px] font-normal text-slate-400">
              {currentBody.length}/500
            </span>
          </div>
          <textarea
            id="broadcast-body-input"
            rows={4}
            maxLength={500}
            value={currentBody}
            onChange={(e) => p.setBody(e.target.value)}
            placeholder={t('platform.desktopNotifications.bodyPlaceholder')}
            className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-800 dark:bg-slate-850 dark:text-white leading-relaxed resize-none"
          />
        </div>
      </div>

      {/* Step 3: Turi */}
      <div className="space-y-2.5 sm:space-y-3">
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50 text-xs font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
            3
          </span>
          <h3 className="text-xs font-bold text-slate-900 dark:text-white">
            {t('platform.desktopNotifications.stepKind')}
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3" role="radiogroup" aria-label={t('platform.desktopNotifications.stepKind')}>
          {KIND_OPTIONS.map((item) => {
            const Icon = item.icon;
            const isSelected = p.kind === item.id;
            return (
              <button
                key={item.id}
                ref={kindRefs[item.id]}
                type="button"
                role="radio"
                aria-checked={isSelected}
                tabIndex={isSelected ? 0 : -1}
                onClick={() => p.setKind(item.id)}
                onKeyDown={(e) => handleKindKeyDown(e, item.id)}
                className={`relative flex flex-col justify-between p-3 sm:p-3.5 rounded-xl border text-left transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/30 ${
                  isSelected
                    ? 'border-emerald-600 bg-white ring-1 ring-emerald-600 shadow-xs dark:border-emerald-500 dark:bg-slate-850'
                    : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-850'
                }`}
              >
                <div className="flex items-start justify-between w-full">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${item.iconBg}`}>
                    <Icon size={16} />
                  </div>
                  <div
                    className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-600 text-white'
                        : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                    }`}
                  >
                    {isSelected && <Check size={11} strokeWidth={3} />}
                  </div>
                </div>
                <div className="mt-2.5 sm:mt-3">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    {t(item.titleKey)}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                    {t(item.descKey)}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 4: Muddat va vaqt */}
      <div className="space-y-2.5 sm:space-y-3">
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50 text-xs font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
            4
          </span>
          <h3 className="text-xs font-bold text-slate-900 dark:text-white">
            {t('platform.desktopNotifications.stepSchedule')}
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {/* Duration selection */}
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
                  <p
                    id="desktop-custom-hours-error"
                    role="alert"
                    className="text-[11px] font-medium text-rose-600 dark:text-rose-400"
                  >
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

          {/* Schedule selection */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {t('platform.desktopNotifications.sendTime')}
            </label>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                aria-pressed="true"
                className="rounded-xl px-3.5 py-1.5 text-xs font-semibold border border-emerald-600 bg-emerald-50 text-emerald-700 dark:border-emerald-500 dark:bg-emerald-950/60 dark:text-emerald-300 shadow-xs cursor-default"
              >
                {t('platform.desktopNotifications.sendNow')}
              </button>
              <button
                type="button"
                disabled
                aria-pressed="false"
                className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold border border-slate-200 bg-white text-slate-400 dark:border-slate-800 dark:bg-slate-850 dark:text-slate-500 opacity-60 cursor-not-allowed"
                title={t('platform.desktopNotifications.comingSoon', { defaultValue: 'Tez kunda' })}
              >
                <span>{t('platform.desktopNotifications.sendSchedule')}</span>
                <span className="rounded bg-slate-200 px-1.5 py-0.2 text-[10px] font-semibold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                  {t('platform.desktopNotifications.comingSoon', { defaultValue: 'Tez kunda' })}
                </span>
              </button>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
              {t('platform.desktopNotifications.sendNowNote')}
            </p>
          </div>
        </div>
      </div>

      {/* Footer controls: Responsive layout and disabled reason hint */}
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
    </section>
  );
}

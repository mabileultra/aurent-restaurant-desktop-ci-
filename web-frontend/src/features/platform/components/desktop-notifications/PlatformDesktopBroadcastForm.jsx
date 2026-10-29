import React from 'react';
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

export default function PlatformDesktopBroadcastForm({ p }) {
  const { t } = p;
  const isUzTab = p.langTab === 'uz';
  const currentTitle = isUzTab ? p.titleUz : p.titleRu;
  const currentBody = isUzTab ? p.bodyUz : p.bodyRu;

  const handleTitleChange = (val) => {
    if (isUzTab) p.setTitleUz(val);
    else p.setTitleRu(val);
  };

  const handleBodyChange = (val) => {
    if (isUzTab) p.setBodyUz(val);
    else p.setBodyRu(val);
  };

  const isUzFilled = Boolean(p.titleUz.trim() && p.bodyUz.trim());
  const isRuFilled = Boolean(p.titleRu.trim() && p.bodyRu.trim());

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-6">
      {/* Form Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
            <Send size={18} />
          </div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            {t('platform.desktopNotifications.broadcastTitle')}
          </h2>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          <span>{t('platform.desktopNotifications.draftSaved')}</span>
        </div>
      </div>

      {/* Step 1: Kimga */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50 text-xs font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
            1
          </span>
          <h3 className="text-xs font-bold text-slate-900 dark:text-white">
            {t('platform.desktopNotifications.stepTarget')}
          </h3>
        </div>

        <div className="inline-flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800/80">
          <button
            type="button"
            onClick={() => p.setTargetScope('ALL')}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
              p.targetScope === 'ALL'
                ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            {t('platform.desktopNotifications.targetAll')}
          </button>
          <button
            type="button"
            onClick={() => p.setTargetScope('SELECT')}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
              p.targetScope === 'SELECT'
                ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            {t('platform.desktopNotifications.targetSelect')}
          </button>
        </div>

        {p.targetScope === 'SELECT' && (
          <div className="flex flex-wrap items-center gap-2 pt-0.5">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Guruh:</span>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => p.setTargetGroup('OUTDATED')}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold border transition-all ${
                  p.targetGroup === 'OUTDATED'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-700 dark:border-emerald-500 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                {t('platform.desktopNotifications.targetGroupOutdated')}
              </button>
              <button
                type="button"
                onClick={() => p.setTargetGroup('CUSTOM')}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold border transition-all ${
                  p.targetGroup === 'CUSTOM'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-700 dark:border-emerald-500 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                {t('platform.desktopNotifications.targetGroupCustom')}
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-850">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-600 shadow-xs dark:bg-slate-800 dark:text-slate-300">
            <Monitor size={17} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-900 dark:text-white">
              {t('platform.desktopNotifications.registersCount', { count: p.totalRegistersCount })}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {p.targetScope === 'ALL'
                ? t('platform.desktopNotifications.allCompaniesOfflineNote')
                : 'Tanlangan filtr bo‘yicha oflayn kassalar internetga ulanganda oladi'}
            </p>
          </div>
        </div>
      </div>

      {/* Step 2: Xabar matni */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50 text-xs font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
            2
          </span>
          <h3 className="text-xs font-bold text-slate-900 dark:text-white">
            {t('platform.desktopNotifications.stepContent')}
          </h3>
        </div>

        {/* Language Tabs */}
        <div className="flex items-center gap-4 border-b border-slate-200 dark:border-slate-800 text-xs font-medium">
          <button
            type="button"
            onClick={() => p.setLangTab('uz')}
            className={`flex items-center gap-2 pb-2.5 transition-colors border-b-2 ${
              isUzTab
                ? 'border-emerald-600 font-bold text-emerald-700 dark:border-emerald-500 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <span>{t('platform.desktopNotifications.langUz')}</span>
            <span
              className={`rounded px-1.5 py-0.5 text-[10px] font-semibold border ${
                isUzFilled
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                  : 'border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              {isUzFilled ? t('platform.desktopNotifications.badgeFilled') : t('platform.desktopNotifications.badgeEmpty')}
            </span>
          </button>

          <button
            type="button"
            onClick={() => p.setLangTab('ru')}
            className={`flex items-center gap-2 pb-2.5 transition-colors border-b-2 ${
              !isUzTab
                ? 'border-emerald-600 font-bold text-emerald-700 dark:border-emerald-500 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <span>{t('platform.desktopNotifications.langRu')}</span>
            <span
              className={`rounded px-1.5 py-0.5 text-[10px] font-semibold border ${
                isRuFilled
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                  : 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
              }`}
            >
              {isRuFilled ? t('platform.desktopNotifications.badgeFilled') : t('platform.desktopNotifications.badgeEmpty')}
            </span>
          </button>
        </div>

        {/* Title Field */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
            <label htmlFor="broadcast-title-input">
              {t('platform.desktopNotifications.fieldTitle')} <span className="text-rose-500">*</span>
            </label>
            <span className="text-[11px] font-normal text-slate-400">
              {(currentTitle || '').length}/60
            </span>
          </div>
          <input
            id="broadcast-title-input"
            type="text"
            maxLength={60}
            value={currentTitle}
            onChange={(e) => handleTitleChange(e.target.value)}
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
              {(currentBody || '').length}/500
            </span>
          </div>
          <textarea
            id="broadcast-body-input"
            rows={4}
            maxLength={500}
            value={currentBody}
            onChange={(e) => handleBodyChange(e.target.value)}
            placeholder={t('platform.desktopNotifications.bodyPlaceholder')}
            className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-800 dark:bg-slate-850 dark:text-white leading-relaxed resize-none"
          />
          <p className="text-[11px] text-slate-400 dark:text-slate-500 pt-0.5">
            {t('platform.desktopNotifications.langFallbackHint')}
          </p>
        </div>
      </div>

      {/* Step 3: Turi */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50 text-xs font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
            3
          </span>
          <h3 className="text-xs font-bold text-slate-900 dark:text-white">
            {t('platform.desktopNotifications.stepKind')}
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Card: Xabar */}
          <div
            onClick={() => p.setKind('MESSAGE')}
            className={`relative flex flex-col justify-between p-3.5 rounded-xl border transition-all cursor-pointer ${
              p.kind === 'MESSAGE'
                ? 'border-emerald-600 bg-white ring-1 ring-emerald-600 shadow-xs dark:border-emerald-500 dark:bg-slate-850'
                : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-850'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
                <MessageSquare size={16} />
              </div>
              <div
                className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                  p.kind === 'MESSAGE'
                    ? 'border-emerald-600 bg-emerald-600 text-white'
                    : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                }`}
              >
                {p.kind === 'MESSAGE' && <Check size={11} strokeWidth={3} />}
              </div>
            </div>
            <div className="mt-3">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                {t('platform.desktopNotifications.kindMessage')}
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                {t('platform.desktopNotifications.kindMessageDesc')}
              </p>
            </div>
          </div>

          {/* Card: Yangilanish */}
          <div
            onClick={() => p.setKind('UPDATE')}
            className={`relative flex flex-col justify-between p-3.5 rounded-xl border transition-all cursor-pointer ${
              p.kind === 'UPDATE'
                ? 'border-emerald-600 bg-white ring-1 ring-emerald-600 shadow-xs dark:border-emerald-500 dark:bg-slate-850'
                : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-850'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
                <RefreshCw size={16} />
              </div>
              <div
                className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                  p.kind === 'UPDATE'
                    ? 'border-emerald-600 bg-emerald-600 text-white'
                    : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                }`}
              >
                {p.kind === 'UPDATE' && <Check size={11} strokeWidth={3} />}
              </div>
            </div>
            <div className="mt-3">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                {t('platform.desktopNotifications.kindUpdate')}
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                {t('platform.desktopNotifications.kindUpdateDesc')}
              </p>
            </div>
          </div>

          {/* Card: Muhim */}
          <div
            onClick={() => p.setKind('ALERT')}
            className={`relative flex flex-col justify-between p-3.5 rounded-xl border transition-all cursor-pointer ${
              p.kind === 'ALERT'
                ? 'border-emerald-600 bg-white ring-1 ring-emerald-600 shadow-xs dark:border-emerald-500 dark:bg-slate-850'
                : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-850'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300">
                <AlertTriangle size={16} />
              </div>
              <div
                className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                  p.kind === 'ALERT'
                    ? 'border-emerald-600 bg-emerald-600 text-white'
                    : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                }`}
              >
                {p.kind === 'ALERT' && <Check size={11} strokeWidth={3} />}
              </div>
            </div>
            <div className="mt-3">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                {t('platform.desktopNotifications.kindAlert')}
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                {t('platform.desktopNotifications.kindAlertDesc')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Step 4: Muddat va vaqt */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50 text-xs font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
            4
          </span>
          <h3 className="text-xs font-bold text-slate-900 dark:text-white">
            {t('platform.desktopNotifications.stepSchedule')}
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Duration selection */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {t('platform.desktopNotifications.visibleDuration')}
            </label>
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: '1d', label: t('platform.desktopNotifications.duration1d') },
                { id: '3d', label: t('platform.desktopNotifications.duration3d') },
                { id: '1w', label: t('platform.desktopNotifications.duration1w') },
                { id: 'other', label: t('platform.desktopNotifications.durationOther') },
              ].map((btn) => (
                <button
                  key={btn.id}
                  type="button"
                  onClick={() => p.setDuration(btn.id)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-semibold border transition-all ${
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
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="number"
                  min="1"
                  max="720"
                  value={p.customHours}
                  onChange={(e) => p.setCustomHours(e.target.value)}
                  placeholder={t('platform.desktopNotifications.customHoursPlaceholder')}
                  className="w-28 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-850 dark:text-white"
                />
                <span className="text-xs text-slate-500 dark:text-slate-400">soat</span>
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
                onClick={() => p.setScheduleType('NOW')}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold border transition-all ${
                  p.scheduleType === 'NOW'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-700 dark:border-emerald-500 dark:bg-emerald-950/60 dark:text-emerald-300 shadow-xs'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                {t('platform.desktopNotifications.sendNow')}
              </button>
              <button
                type="button"
                onClick={() => p.setScheduleType('SCHEDULE')}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold border transition-all ${
                  p.scheduleType === 'SCHEDULE'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-700 dark:border-emerald-500 dark:bg-emerald-950/60 dark:text-emerald-300 shadow-xs'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                {t('platform.desktopNotifications.sendSchedule')}
              </button>
            </div>

            {p.scheduleType === 'SCHEDULE' && (
              <div className="pt-1">
                <input
                  type="datetime-local"
                  value={p.scheduleTime}
                  onChange={(e) => p.setScheduleTime(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-850 dark:text-white"
                />
              </div>
            )}

            <p className="text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
              {p.scheduleType === 'NOW'
                ? t('platform.desktopNotifications.sendNowNote')
                : t('platform.desktopNotifications.scheduleNote')}
            </p>
          </div>
        </div>
      </div>

      {/* Footer controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-slate-100 pt-4 dark:border-slate-800">
        <label className="inline-flex items-center gap-2 cursor-pointer select-none text-xs text-slate-600 dark:text-slate-400">
          <input
            type="checkbox"
            checked={p.needsConfirm}
            onChange={(e) => p.setNeedsConfirm(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
          />
          <span>{t('platform.desktopNotifications.confirmModalCheckbox')}</span>
        </label>

        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          <button
            type="button"
            onClick={p.handleClear}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-750 transition-colors cursor-pointer"
          >
            {t('platform.desktopNotifications.clearBtn')}
          </button>
          <button
            type="button"
            onClick={p.handleSend}
            disabled={p.sendPending}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-800 focus:ring-2 focus:ring-emerald-600/30 transition-all cursor-pointer disabled:opacity-50"
          >
            <Bell size={15} />
            <span>{t('platform.desktopNotifications.sendBtn', { count: p.totalRegistersCount })}</span>
          </button>
        </div>
      </div>
    </section>
  );
}

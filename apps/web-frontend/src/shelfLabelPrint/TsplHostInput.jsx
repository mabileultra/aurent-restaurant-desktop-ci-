import React from 'react';
import { Loader2, Radar } from 'lucide-react';

export default function TsplHostInput({ host, scanning, onChange, onBlur, onAutoDetect, t }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="text-xs font-medium text-slate-700 dark:text-slate-200">
          {t('usersBarcodePrint.tsplHost', { defaultValue: 'IP-адрес принтера' })}
        </label>
        <button
          type="button"
          disabled={scanning}
          onClick={() => onAutoDetect?.({ save: true })}
          className="inline-flex items-center gap-1.5 rounded-lg border border-violet-300 bg-white px-2.5 py-1 text-xs font-medium text-violet-900 hover:bg-violet-50 disabled:opacity-60 dark:border-violet-700 dark:bg-slate-900 dark:text-violet-100"
        >
          {scanning ? <Loader2 size={14} className="animate-spin" /> : <Radar size={14} />}
          {scanning
            ? t('usersBarcodePrint.tsplDetecting', { defaultValue: 'Ищем…' })
            : t('usersBarcodePrint.tsplDetect', { defaultValue: 'Найти автоматически' })}
        </button>
      </div>
      <input
        type="text"
        inputMode="decimal"
        autoComplete="off"
        placeholder="192.168.1.200"
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white"
        value={host || ''}
        onChange={(e) => onChange?.(e.target.value)}
        onBlur={onBlur}
      />
      <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
        {t('usersBarcodePrint.tsplFindManualHint', {
          defaultValue:
            'Вручную: на XP-365B распечатайте self-test (удерживайте FEED 3 сек) — IP будет на этикетке. Или посмотрите в роутере список устройств.',
        })}
      </p>
    </div>
  );
}

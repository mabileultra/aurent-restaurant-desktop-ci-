import React from 'react';

export default function TsplPortGapInputs({ settings, onChange, onPersist, t }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-slate-700 dark:text-slate-200">
          {t('usersBarcodePrint.tsplPort', { defaultValue: 'Порт' })}
        </label>
        <input
          type="number"
          min={1}
          max={65535}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white"
          value={settings?.port ?? 9100}
          onChange={(e) => onChange?.((s) => ({ ...s, port: Number(e.target.value) || 9100 }))}
          onBlur={() => onPersist?.({ port: Number(settings?.port) || 9100 })}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-slate-700 dark:text-slate-200">
          {t('usersBarcodePrint.tsplGap', { defaultValue: 'GAP (мм)' })}
        </label>
        <input
          type="number"
          min={0}
          max={10}
          step={0.5}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white"
          value={settings?.gapMm ?? 2}
          onChange={(e) => onChange?.((s) => ({ ...s, gapMm: Number(e.target.value) || 2 }))}
          onBlur={() => onPersist?.({ gapMm: Number(settings?.gapMm) || 2 })}
        />
      </div>
    </div>
  );
}

import React from 'react';
import { RotateCcw } from 'lucide-react';
import { ToggleSwitch } from './ShelfLabelPrintControls';
import ShelfLabelNumField from './ShelfLabelNumField';

export default function ShelfLabelCalibrationSection({
  layout,
  patchLayout,
  resetPresetDefaults,
  maxPadXmm,
  maxPadYmm,
  t,
}) {
  return (
    <section className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/40 p-3 dark:border-emerald-900/50 dark:bg-emerald-950/20">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            {t('usersBarcodePrint.calibrationTitle', { defaultValue: 'Калибровка печати' })}
          </h3>
          <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
            {t('usersBarcodePrint.calibrationHint', {
              defaultValue: 'Сдвиги по умолчанию 0. Подстройте после калибровки FEED и драйвера Windows.',
            })}
          </p>
        </div>
        <button
          type="button"
          onClick={resetPresetDefaults}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
        >
          <RotateCcw size={14} aria-hidden />
          {t('usersBarcodePrint.resetPresetDefaults', { defaultValue: 'Сбросить эталон' })}
        </button>
      </div>

      <div className="space-y-3">
        <ToggleSwitch
          label={t('usersBarcodePrint.rotate180', { defaultValue: 'Повернуть на 180°' })}
          checked={layout.rotate180}
          onChange={(rotate180) => patchLayout({ rotate180 })}
        />
        <ShelfLabelNumField
          label={t('usersBarcodePrint.offsetX', { defaultValue: 'Сдвиг вправо (мм)' })}
          value={layout.offsetXmm ?? 0}
          min={-5}
          max={5}
          step={0.1}
          onChange={(offsetXmm) => patchLayout({ offsetXmm })}
        />
        <ShelfLabelNumField
          label={t('usersBarcodePrint.offsetY', { defaultValue: 'Сдвиг вверх (мм)' })}
          value={layout.offsetYmm ?? 0}
          min={-5}
          max={5}
          step={0.1}
          onChange={(offsetYmm) => patchLayout({ offsetYmm })}
        />
        <p className="shelflabel-settings__offset-hint rounded-md bg-white/70 px-2 py-1.5 text-xs text-slate-600 dark:bg-slate-900/40 dark:text-slate-300">
          {t('usersBarcodePrint.offsetCalibrationHint')}
        </p>
        <ShelfLabelNumField
          label={t('usersBarcodePrint.padX', { defaultValue: 'Отступ слева/справа (мм)' })}
          value={layout.padXmm}
          min={0}
          max={maxPadXmm}
          step={0.5}
          onChange={(padXmm) => patchLayout({ padXmm })}
        />
        <ShelfLabelNumField
          label={t('usersBarcodePrint.padY', { defaultValue: 'Отступ сверху/снизу (мм)' })}
          value={layout.padYmm}
          min={0}
          max={maxPadYmm}
          step={0.5}
          onChange={(padYmm) => patchLayout({ padYmm })}
        />
      </div>
    </section>
  );
}

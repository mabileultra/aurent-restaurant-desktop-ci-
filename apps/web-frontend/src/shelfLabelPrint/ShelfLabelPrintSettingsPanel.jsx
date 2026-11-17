import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { findLabelPresetByLayout, isWidePrinterPreset } from './constants';
import LabelTsplSettingsPanel from './LabelTsplSettingsPanel';
import ShelfLabelPresetPicker, { formatPresetSize } from './ShelfLabelPresetPicker';
import ShelfLabelCalibrationSection from './ShelfLabelCalibrationSection';
import ShelfLabelFineTuneSection from './ShelfLabelFineTuneSection';

export default function ShelfLabelPrintSettingsPanel({
  t,
  layout,
  patchLayout,
  maxPadXmm,
  maxPadYmm,
  applyPreset,
  resetPresetDefaults,
  compact = false,
  sidebar = false,
}) {
  const activePreset = findLabelPresetByLayout(layout);
  const activeId = activePreset?.id || layout.presetId;

  const rootCls = [
    'shelflabel-settings rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900',
    sidebar ? 'shelflabel-settings--sidebar' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={rootCls}>
      <p className="shelflabel-settings__title text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {t('usersBarcodePrint.printSettings', { defaultValue: 'Настройки печати' })}
      </p>

      {!compact ? (
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          {t('usersBarcodePrint.settingsPersistHint', {
            defaultValue: 'Настройки сохраняются автоматически — подкрутите один раз под ваш принтер.',
          })}
        </p>
      ) : null}

      <LabelTsplSettingsPanel t={t} />

      <ShelfLabelPresetPicker
        activeId={activeId}
        applyPreset={applyPreset}
        compact={compact}
        t={t}
      />

      {!compact ? (
        <div className="shelflabel-settings__printer-guide mt-4 rounded-lg border border-sky-200 bg-sky-50/60 px-3 py-2.5 text-xs text-sky-950 dark:border-sky-900/50 dark:bg-sky-950/30 dark:text-sky-100">
          <p className="font-semibold">{t('usersBarcodePrint.printerCalibrationTitle')}</p>
          <ol className="mt-1.5 list-decimal space-y-1 pl-4">
            <li>{t('usersBarcodePrint.printerCalibrationFeed')}</li>
            <li>{t('usersBarcodePrint.printerCalibrationDriver')}</li>
            <li>{t('usersBarcodePrint.printerCalibrationOffset')}</li>
          </ol>
        </div>
      ) : null}

      {activePreset ? (
        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-600 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-300">
          <p className="font-medium text-slate-700 dark:text-slate-200">
            {t('usersBarcodePrint.windowsProfileTitle', { defaultValue: 'Профиль в Windows' })}
          </p>
          <p className="mt-1">
            {t('usersBarcodePrint.windowsProfileHint', {
              defaultValue: 'Создайте пользовательский формат бумаги с именем «{{profile}}» — точно {{w}} × {{h}} мм.',
              profile: activePreset.profileId,
              w: formatPresetSize(activePreset).replace(/ × .*$/, ''),
              h: Number(activePreset.paperHmm) % 1
                ? Number(activePreset.paperHmm).toFixed(2)
                : Number(activePreset.paperHmm),
            })}
          </p>
          {isWidePrinterPreset(activePreset) ? (
            <p className="mt-2 flex items-start gap-1.5 text-amber-800 dark:text-amber-200">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" aria-hidden />
              {t('usersBarcodePrint.widePrinterWarning')}
            </p>
          ) : null}
        </div>
      ) : null}

      <ShelfLabelCalibrationSection
        layout={layout}
        patchLayout={patchLayout}
        resetPresetDefaults={resetPresetDefaults}
        maxPadXmm={maxPadXmm}
        maxPadYmm={maxPadYmm}
        t={t}
      />

      <ShelfLabelFineTuneSection
        layout={layout}
        patchLayout={patchLayout}
        t={t}
      />
    </div>
  );
}

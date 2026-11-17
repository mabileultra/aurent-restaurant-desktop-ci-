import React from 'react';
import { AlertTriangle } from 'lucide-react';
import {
  LABEL_SIZE_CATEGORIES,
  LABEL_SIZE_PRESETS,
  isWidePrinterPreset,
} from './constants';

export function formatPresetSize(preset) {
  const w = Number(preset?.paperWmm ?? 0);
  const h = Number(preset?.paperHmm ?? 0);
  const fmt = (n) => (Number.isInteger(n) ? String(n) : n.toFixed(2));
  return `${fmt(w)} × ${fmt(h)} мм`;
}

export default function ShelfLabelPresetPicker({
  activeId,
  applyPreset,
  compact = false,
  t,
}) {
  return (
    <div className={`space-y-4 ${compact ? 'mt-3' : 'mt-4'}`}>
      {LABEL_SIZE_CATEGORIES.map((category) => {
        const presets = LABEL_SIZE_PRESETS.filter((p) => p.category === category.id);
        if (!presets.length) return null;

        return (
          <section key={category.id} className="shelflabel-settings__group">
            <h3 className="shelflabel-settings__group-title mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {t(category.i18nKey)}
            </h3>
            <div className="shelflabel-settings__preset-grid grid grid-cols-1 gap-2 sm:grid-cols-2">
              {presets.map((preset) => {
                const active = activeId === preset.id;
                const wide = isWidePrinterPreset(preset);
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => applyPreset(preset)}
                    className={`shelflabel-settings__preset rounded-xl border px-3 py-2.5 text-left transition ${
                      active
                        ? 'border-emerald-600 bg-emerald-50 ring-1 ring-emerald-600/30 dark:border-emerald-500 dark:bg-emerald-950/40'
                        : 'border-slate-200 bg-slate-50 hover:border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:hover:border-slate-500'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span
                        className={`text-sm font-semibold ${
                          active
                            ? 'text-emerald-900 dark:text-emerald-100'
                            : 'text-slate-800 dark:text-slate-100'
                        }`}
                      >
                        {formatPresetSize(preset)}
                      </span>
                      {wide ? (
                        <span
                          className="inline-flex shrink-0 items-center gap-0.5 rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-900 dark:bg-amber-950/60 dark:text-amber-200"
                          title={t('usersBarcodePrint.widePrinterOnly')}
                        >
                          <AlertTriangle size={11} aria-hidden />
                          82+
                        </span>
                      ) : null}
                    </div>
                    <span
                      className={`mt-0.5 block text-xs ${
                        active ? 'text-emerald-800/90 dark:text-emerald-200/90' : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {t(preset.i18nKey)}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}

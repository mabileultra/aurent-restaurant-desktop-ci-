import React from 'react';
import { getPickerText } from '../utils/platformDatePickerUtils';

export default function PlatformDateRangePresets({
  presets,
  draftFrom,
  draftTo,
  handlePresetClick,
  isBlue,
  lang,
  t,
}) {
  return (
    <div className="p-2 bg-slate-50/60 dark:bg-slate-950/40 flex sm:flex-col overflow-x-auto sm:overflow-visible gap-1 sm:w-40 shrink-0">
      {presets.map((preset) => {
        const isActive =
          draftFrom === preset.range.from && draftTo === preset.range.to;
        return (
          <button
            key={preset.id}
            type="button"
            onClick={() => handlePresetClick(preset)}
            className={`px-3 py-2 text-xs rounded-lg text-left transition-colors whitespace-nowrap min-h-[36px] flex items-center font-medium ${
              isActive
                ? isBlue
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 font-semibold ring-1 ring-blue-500/20'
                  : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 font-semibold ring-1 ring-emerald-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            {getPickerText(preset.id, lang, t)}
          </button>
        );
      })}
    </div>
  );
}

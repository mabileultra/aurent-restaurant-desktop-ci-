import React, { useMemo } from 'react';
import { Check, Clock } from 'lucide-react';
import {
  DEFAULT_PRESET_TIMES,
  generateHourOptions,
  generateMinuteOptions,
} from '../utils/platformTimePickerUtils';

export default function PlatformTimePickerDropdown({
  selectedHour = '09',
  selectedMinute = '00',
  onSelectHour,
  onSelectMinute,
  presets = DEFAULT_PRESET_TIMES,
  onSelectPreset,
  onSelectNow,
  onClose,
  align = 'left',
  minuteStep = 5,
}) {
  const hourOptions = useMemo(() => generateHourOptions(), []);
  const minuteOptions = useMemo(() => generateMinuteOptions(minuteStep), [minuteStep]);

  return (
    <div
      role="dialog"
      aria-label="Vaqt tanlash"
      className={`absolute z-50 mt-1.5 w-64 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl dark:border-slate-800 dark:bg-slate-900 ${
        align === 'right' ? 'right-0' : 'left-0'
      }`}
    >
      {/* Quick Presets */}
      {presets && presets.length > 0 && (
        <div className="mb-2.5 pb-2 border-b border-slate-100 dark:border-slate-800">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
            Tezkor vaqtlar
          </p>
          <div className="flex flex-wrap gap-1">
            {presets.map((time) => (
              <button
                key={time}
                type="button"
                onClick={() => onSelectPreset(time)}
                className={`rounded-lg px-2 py-1 text-[11px] font-semibold border transition-all cursor-pointer ${
                  `${selectedHour}:${selectedMinute}` === time
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-700 dark:border-emerald-500 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                {time}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Dual Columns: Soat & Daqiqa */}
      <div className="grid grid-cols-2 gap-2 text-center">
        <div>
          <span className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
            Soat
          </span>
          <div className="max-h-40 overflow-y-auto rounded-xl border border-slate-100 p-1 space-y-0.5 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50">
            {hourOptions.map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => onSelectHour(h)}
                aria-pressed={selectedHour === h}
                className={`w-full rounded-lg py-1 text-xs font-semibold transition-all cursor-pointer ${
                  selectedHour === h
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-200/70 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
              >
                {h}
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
            Daqiqa
          </span>
          <div className="max-h-40 overflow-y-auto rounded-xl border border-slate-100 p-1 space-y-0.5 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50">
            {minuteOptions.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => onSelectMinute(m)}
                aria-pressed={selectedMinute === m}
                className={`w-full rounded-lg py-1 text-xs font-semibold transition-all cursor-pointer ${
                  selectedMinute === m
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-200/70 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 dark:border-slate-800">
        <button
          type="button"
          onClick={onSelectNow}
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 cursor-pointer"
        >
          <Clock size={12} />
          <span>Hozir</span>
        </button>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition-colors cursor-pointer"
        >
          <Check size={12} />
          <span>Tayyor</span>
        </button>
      </div>
    </div>
  );
}

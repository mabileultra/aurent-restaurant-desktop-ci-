import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { getPickerText } from '../utils/platformDatePickerUtils';

export default function PlatformDatePickerCalendar({
  effectiveAlign,
  quickDays,
  handleQuickDay,
  lang,
  t,
  shiftYear,
  shiftMonth,
  monthTitle,
  weekdays,
  days,
  selectedIso,
  todayIso,
  minIso,
  maxIso,
  handlePickDate,
  isTodayDisabled,
  clearable,
  hasValue,
  handleClear,
  setIsOpen,
}) {
  return (
    <div
      role="dialog"
      aria-label={getPickerText('placeholderSingle', lang, t)}
      className={`absolute z-50 mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl shadow-slate-900/10 dark:shadow-black/50 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150 ${
        effectiveAlign === 'right' ? 'right-0' : 'left-0'
      }`}
      style={{ width: '328px', maxWidth: 'calc(100vw - 2rem)' }}
    >
      {/* Optional Quick Days Bar */}
      {Array.isArray(quickDays) && quickDays.length > 0 && (
        <div className="p-2 bg-slate-50/60 dark:bg-slate-950/40 border-b border-slate-100 dark:border-slate-800 flex items-center justify-center gap-1.5">
          {quickDays.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => handleQuickDay(d)}
              className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 dark:hover:bg-emerald-950/40 dark:hover:border-emerald-700 dark:hover:text-emerald-300 font-medium transition-colors"
            >
              {getPickerText('quickDays', lang, t, { count: d })}
            </button>
          ))}
        </div>
      )}

      {/* Calendar Body */}
      <div className="p-3">
        {/* Month & Year Navigation */}
        <div className="flex items-center justify-between mb-2.5 px-1">
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => shiftYear(-1)}
              aria-label={getPickerText('prevYear', lang, t)}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-800 dark:text-slate-500 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ChevronsLeft size={15} />
            </button>
            <button
              type="button"
              onClick={() => shiftMonth(-1)}
              aria-label={getPickerText('prevMonth', lang, t)}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
          </div>

          <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white capitalize select-none truncate px-1">
            {monthTitle}
          </span>

          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => shiftMonth(1)}
              aria-label={getPickerText('nextMonth', lang, t)}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
            <button
              type="button"
              onClick={() => shiftYear(1)}
              aria-label={getPickerText('nextYear', lang, t)}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-800 dark:text-slate-500 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ChevronsRight size={15} />
            </button>
          </div>
        </div>

        {/* Weekdays Row */}
        <div className="grid grid-cols-7 gap-1 text-center mb-1 select-none">
          {weekdays.map((w) => (
            <span
              key={w}
              className="w-10 h-6 flex items-center justify-center text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider"
            >
              {w}
            </span>
          ))}
        </div>

        {/* Days Grid: 40x40px sensor tap targets */}
        <div className="grid grid-cols-7 gap-1 select-none">
          {days.map((day) => {
            const isSelected = day.iso === selectedIso;
            const isToday = day.iso === todayIso;
            const isBeforeMin = minIso && day.iso < minIso;
            const isAfterMax = maxIso && day.iso > maxIso;
            const isDayDisabled = isBeforeMin || isAfterMax;

            let cellClass = 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800';

            if (isSelected) {
              cellClass = 'bg-emerald-600 text-white font-semibold shadow-sm shadow-emerald-700/20';
            } else if (isToday) {
              cellClass = 'ring-1 ring-emerald-500/80 font-bold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50/60 dark:hover:bg-emerald-950/30';
            } else if (!day.isCurrentMonth) {
              cellClass = 'text-slate-300 dark:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/40';
            }

            if (isDayDisabled) {
              cellClass = 'opacity-25 cursor-not-allowed text-slate-400 dark:text-slate-600';
            }

            return (
              <button
                key={day.iso}
                type="button"
                disabled={isDayDisabled}
                onClick={() => handlePickDate(day.iso)}
                className={`w-10 h-10 min-w-[40px] min-h-[40px] rounded-lg flex items-center justify-center text-xs transition-colors duration-100 ${cellClass}`}
              >
                {day.dayNumber}
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="p-2.5 bg-slate-50/80 dark:bg-slate-950/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
        <button
          type="button"
          disabled={isTodayDisabled}
          onClick={() => handlePickDate(todayIso)}
          className="px-2.5 py-1 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {getPickerText('today', lang, t)}
        </button>
        <div className="flex items-center gap-1.5 ml-auto">
          {clearable && hasValue && (
            <button
              type="button"
              onClick={handleClear}
              className="px-2.5 py-1 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 font-medium transition-colors"
            >
              {getPickerText('clear', lang, t)}
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="px-2.5 py-1 text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-lg font-medium transition-colors"
          >
            {getPickerText('close', lang, t)}
          </button>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { getPickerText } from '../utils/platformDatePickerUtils';
import { getRangeCellClass } from '../utils/dateRangeStyleHelpers';

export default function PlatformDateRangeCalendar({
  monthTitle,
  shiftYear,
  shiftMonth,
  weekdays,
  days,
  effectiveFrom,
  effectiveTo,
  todayIso,
  minDate,
  maxDate,
  isBlue,
  handleDayClick,
  handleDayMouseEnter,
  handleDayMouseLeave,
  lang,
  t,
}) {
  return (
    <div className="p-3 shrink-0 sm:w-[335px]" onMouseLeave={handleDayMouseLeave}>
      {/* Month & Year Navigation Header */}
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
          const isBeforeMin = minDate && day.iso < minDate;
          const isAfterMax = maxDate && day.iso > maxDate;
          const isDayDisabled = isBeforeMin || isAfterMax;

          const cellClass = getRangeCellClass({
            dayIso: day.iso,
            effectiveFrom,
            effectiveTo,
            todayIso,
            isCurrentMonth: day.isCurrentMonth,
            isDayDisabled,
            isBlue,
          });

          return (
            <button
              key={day.iso}
              type="button"
              disabled={isDayDisabled}
              onClick={() => handleDayClick(day.iso)}
              onMouseEnter={() => handleDayMouseEnter(day.iso, isDayDisabled)}
              className={`w-10 h-10 min-w-[40px] min-h-[40px] flex items-center justify-center text-xs transition-colors duration-100 ${cellClass}`}
            >
              {day.dayNumber}
            </button>
          );
        })}
      </div>
    </div>
  );
}

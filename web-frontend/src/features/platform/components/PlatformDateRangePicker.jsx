import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
} from 'lucide-react';
import { addMonths, addYears, subMonths, subYears } from 'date-fns';
import {
  calculateDaysInclusive,
  formatDisplayDate,
  formatMonthTitle,
  getMonthGridDays,
  getPickerText,
  getPresets,
  toIsoDate,
} from '../utils/platformDatePickerUtils';

export default function PlatformDateRangePicker({
  from = '',
  to = '',
  onChange,
  placeholder,
  className = '',
  disabled = false,
  clearable = true,
  align = 'left',
  minDate = '',
  maxDate = '',
  t: propT,
}) {
  let hookT = null;
  let i18n = null;
  try {
    const res = useTranslation();
    hookT = res.t;
    i18n = res.i18n;
  } catch {
    // Graceful fallback when rendered outside I18nextProvider
  }
  const t = propT || hookT;
  const lang = i18n?.language?.startsWith('ru') ? 'ru' : 'uz';
  const isRu = lang === 'ru';

  const [isOpen, setIsOpen] = useState(false);
  const [draftFrom, setDraftFrom] = useState(from || '');
  const [draftTo, setDraftTo] = useState(to || '');
  const [selectionStep, setSelectionStep] = useState('start'); // 'start' | 'end'
  const [hoverDate, setHoverDate] = useState('');
  const [cursorDate, setCursorDate] = useState(() => {
    const initIso = from || to;
    if (initIso && /^\d{4}-\d{2}-\d{2}$/.test(initIso)) {
      const parts = initIso.split('-').map(Number);
      return new Date(parts[0], parts[1] - 1, 1);
    }
    return new Date();
  });

  const containerRef = useRef(null);

  // Sync state when props change while closed
  useEffect(() => {
    if (!isOpen) {
      setDraftFrom(from || '');
      setDraftTo(to || '');
      const initIso = from || to;
      if (initIso && /^\d{4}-\d{2}-\d{2}$/.test(initIso)) {
        const parts = initIso.split('-').map(Number);
        setCursorDate(new Date(parts[0], parts[1] - 1, 1));
      }
    }
  }, [from, to, isOpen]);

  // Click outside and Escape listeners
  useEffect(() => {
    if (!isOpen) return undefined;

    const handleDocumentClick = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setDraftFrom(from || '');
        setDraftTo(to || '');
        setSelectionStep('start');
        setHoverDate('');
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setDraftFrom(from || '');
        setDraftTo(to || '');
        setSelectionStep('start');
        setHoverDate('');
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleDocumentClick);
    document.addEventListener('touchstart', handleDocumentClick);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleDocumentClick);
      document.removeEventListener('touchstart', handleDocumentClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, from, to]);

  const toggleOpen = () => {
    if (disabled) return;
    if (!isOpen) {
      setDraftFrom(from || '');
      setDraftTo(to || '');
      setSelectionStep('start');
      setHoverDate('');
      const initIso = from || to;
      if (initIso && /^\d{4}-\d{2}-\d{2}$/.test(initIso)) {
        const parts = initIso.split('-').map(Number);
        setCursorDate(new Date(parts[0], parts[1] - 1, 1));
      } else {
        setCursorDate(new Date());
      }
    }
    setIsOpen((prev) => !prev);
  };

  const handleApply = () => {
    const finalFrom = draftFrom;
    const finalTo = draftTo || draftFrom;
    if (onChange) {
      onChange({ from: finalFrom, to: finalTo }, finalFrom, finalTo);
    }
    setIsOpen(false);
  };

  const handleCancel = () => {
    setDraftFrom(from || '');
    setDraftTo(to || '');
    setSelectionStep('start');
    setHoverDate('');
    setIsOpen(false);
  };

  const handleClear = () => {
    setDraftFrom('');
    setDraftTo('');
    setSelectionStep('start');
    setHoverDate('');
    if (onChange) {
      onChange({ from: '', to: '' }, '', '');
    }
    setIsOpen(false);
  };

  const handlePresetClick = (preset) => {
    const { from: pFrom, to: pTo } = preset.range;
    setDraftFrom(pFrom);
    setDraftTo(pTo);
    setSelectionStep('start');
    setHoverDate('');
    if (onChange) {
      onChange({ from: pFrom, to: pTo }, pFrom, pTo);
    }
    setIsOpen(false);
  };

  const handleDayClick = (dayIso) => {
    if (selectionStep === 'start' || (draftFrom && draftTo)) {
      setDraftFrom(dayIso);
      setDraftTo('');
      setSelectionStep('end');
    } else {
      if (dayIso < draftFrom) {
        setDraftFrom(dayIso);
        setDraftTo(draftFrom);
      } else {
        setDraftTo(dayIso);
      }
      setSelectionStep('start');
    }
  };

  const handleDayMouseEnter = (dayIso, isDayDisabled) => {
    if (isDayDisabled) return;
    if (selectionStep === 'end' && draftFrom) {
      setHoverDate(dayIso);
    }
  };

  const handleDayMouseLeave = () => {
    if (hoverDate) setHoverDate('');
  };

  const shiftMonth = (delta) => {
    setCursorDate((prev) => (delta < 0 ? subMonths(prev, 1) : addMonths(prev, 1)));
  };

  const shiftYear = (delta) => {
    setCursorDate((prev) => (delta < 0 ? subYears(prev, 1) : addYears(prev, 1)));
  };

  // Range preview calculations
  let effectiveFrom = draftFrom;
  let effectiveTo = draftTo;
  if (selectionStep === 'end' && draftFrom && hoverDate) {
    if (hoverDate < draftFrom) {
      effectiveFrom = hoverDate;
      effectiveTo = draftFrom;
    } else {
      effectiveFrom = draftFrom;
      effectiveTo = hoverDate;
    }
  }

  const todayIso = useMemo(() => toIsoDate(new Date()), []);
  const presets = useMemo(() => getPresets(new Date()), []);
  const days = useMemo(() => getMonthGridDays(cursorDate), [cursorDate]);
  const monthTitle = useMemo(() => formatMonthTitle(cursorDate, isRu), [cursorDate, isRu]);
  const weekdays = useMemo(
    () => (isRu ? ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'] : ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya']),
    [isRu],
  );

  const hasValue = Boolean(from || to);
  const displayText = useMemo(() => {
    if (from && to) {
      return `${formatDisplayDate(from)} — ${formatDisplayDate(to)}`;
    }
    if (from) {
      return `${formatDisplayDate(from)} — …`;
    }
    if (to) {
      return `… — ${formatDisplayDate(to)}`;
    }
    return placeholder || getPickerText('placeholderRange', lang, t);
  }, [from, to, placeholder, lang, t]);

  const footerText = useMemo(() => {
    if (draftFrom && draftTo) {
      const daysCount = calculateDaysInclusive(draftFrom, draftTo);
      return `${formatDisplayDate(draftFrom)} — ${formatDisplayDate(draftTo)} (${getPickerText('daysCount', lang, t, { count: daysCount })})`;
    }
    if (draftFrom) {
      return `${formatDisplayDate(draftFrom)} — … (${getPickerText('selectEndDate', lang, t)})`;
    }
    return getPickerText('notSelected', lang, t);
  }, [draftFrom, draftTo, lang, t]);

  const isFullWidth = className.includes('w-full');

  return (
    <div
      className={`relative ${isFullWidth ? 'w-full' : 'inline-block'} text-left`}
      ref={containerRef}
    >
      {/* Trigger: non-nested interactive wrapper */}
      <div
        role="combobox"
        tabIndex={disabled ? -1 : 0}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        onClick={toggleOpen}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleOpen();
          }
        }}
        className={`group h-[2.375rem] px-3 inline-flex items-center justify-between gap-2.5 rounded-[0.6rem] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-xs font-medium hover:border-slate-300 dark:hover:border-slate-600 focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all shadow-sm select-none ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        } ${isFullWidth ? 'w-full' : ''} ${className}`}
      >
        <span className="inline-flex items-center gap-2 truncate">
          <Calendar
            size={15}
            className="text-emerald-600 dark:text-emerald-400 shrink-0 group-hover:scale-105 transition-transform"
          />
          <span className={`truncate ${hasValue ? 'text-slate-900 dark:text-slate-100 font-semibold' : 'text-slate-400 dark:text-slate-500'}`}>
            {displayText}
          </span>
        </span>
        <span className="inline-flex items-center gap-1 shrink-0 ml-1">
          {clearable && hasValue && !disabled && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              aria-label={getPickerText('clear', lang, t)}
              className="p-1 rounded-full text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X size={12} strokeWidth={2.5} />
            </button>
          )}
          <ChevronDown
            size={14}
            className={`text-slate-400 dark:text-slate-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        </span>
      </div>

      {/* Popover Dropdown */}
      {isOpen && (
        <div
          role="dialog"
          aria-label={getPickerText('placeholderRange', lang, t)}
          className={`absolute z-50 mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl shadow-slate-900/10 dark:shadow-black/50 overflow-hidden flex flex-col w-[328px] sm:w-[496px] max-w-[calc(100vw-1.5rem)] animate-in fade-in zoom-in-95 duration-150 ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {/* Main Body: Presets + Calendar */}
          <div className="flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-slate-800">
            {/* Left Column: Presets */}
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
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 font-semibold ring-1 ring-emerald-500/20'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    {getPickerText(preset.id, lang, t)}
                  </button>
                );
              })}
            </div>

            {/* Right Column: Calendar Grid */}
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
                  const isStart = day.iso === effectiveFrom;
                  const isEnd = day.iso === effectiveTo;
                  const isRangeSpan = effectiveFrom && effectiveTo && effectiveFrom !== effectiveTo;
                  const isInRange = isRangeSpan && day.iso > effectiveFrom && day.iso < effectiveTo;
                  const isSameDay = isStart && isEnd;
                  const isSingleSelected = (isStart && !effectiveTo) || isSameDay;
                  const isToday = day.iso === todayIso;

                  const isBeforeMin = minDate && day.iso < minDate;
                  const isAfterMax = maxDate && day.iso > maxDate;
                  const isDayDisabled = isBeforeMin || isAfterMax;

                  // CSS styling logic for range vs boundary vs normal
                  let cellClass = 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg';

                  if (isSingleSelected) {
                    cellClass = 'bg-emerald-600 text-white font-semibold rounded-lg shadow-sm shadow-emerald-700/20';
                  } else if (isStart) {
                    cellClass = 'bg-emerald-600 text-white font-semibold rounded-l-lg rounded-r-none shadow-sm shadow-emerald-700/20';
                  } else if (isEnd) {
                    cellClass = 'bg-emerald-600 text-white font-semibold rounded-r-lg rounded-l-none shadow-sm shadow-emerald-700/20';
                  } else if (isInRange) {
                    cellClass = 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 rounded-none font-medium';
                  } else if (isToday) {
                    cellClass = 'ring-1 ring-emerald-500/80 font-bold text-emerald-700 dark:text-emerald-400 rounded-lg hover:bg-emerald-50/60 dark:hover:bg-emerald-950/30';
                  } else if (!day.isCurrentMonth) {
                    cellClass = 'text-slate-300 dark:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-lg';
                  }

                  if (isDayDisabled) {
                    cellClass = 'opacity-25 cursor-not-allowed text-slate-400 dark:text-slate-600';
                  }

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
          </div>

          {/* Footer Bar */}
          <div className="p-3 bg-slate-50/80 dark:bg-slate-950/60 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium truncate max-w-[240px]">
              {footerText}
            </span>
            <div className="flex items-center gap-2 ml-auto">
              {(draftFrom || draftTo) && (
                <button
                  type="button"
                  onClick={() => {
                    setDraftFrom('');
                    setDraftTo('');
                    setSelectionStep('start');
                  }}
                  className="px-2.5 py-1.5 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 font-medium transition-colors"
                >
                  {getPickerText('clear', lang, t)}
                </button>
              )}
              <button
                type="button"
                onClick={handleCancel}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition-colors"
              >
                {getPickerText('cancel', lang, t)}
              </button>
              <button
                type="button"
                onClick={handleApply}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-sm shadow-emerald-700/20 transition-colors"
              >
                {getPickerText('apply', lang, t)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

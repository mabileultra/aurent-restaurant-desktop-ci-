import React from 'react';
import { getPickerText } from '../utils/platformDatePickerUtils';
import PlatformDateRangeCalendar from './PlatformDateRangeCalendar';
import PlatformDateRangeFooter from './PlatformDateRangeFooter';
import PlatformDateRangePresets from './PlatformDateRangePresets';
import PlatformDateRangePickerTrigger from './PlatformDateRangePickerTrigger';
import { usePlatformDateRangeState } from '../hooks/usePlatformDateRangeState';

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
  theme = 'emerald',
  variant = 'default',
  t: propT,
}) {
  const isBlue = theme === 'blue';
  const isFullWidth = className.includes('w-full');

  const {
    t,
    lang,
    containerRef,
    isOpen,
    setIsOpen,
    draftFrom,
    setDraftFrom,
    draftTo,
    setDraftTo,
    setSelectionStep,
    effectiveAlign,
    toggleOpen,
    handleApply,
    handleCancel,
    handleClear,
    handlePresetClick,
    handleDayClick,
    handleDayMouseEnter,
    handleDayMouseLeave,
    shiftMonth,
    shiftYear,
    effectiveFrom,
    effectiveTo,
    todayIso,
    presets,
    days,
    monthTitle,
    weekdays,
    hasValue,
    displayText,
    footerText,
  } = usePlatformDateRangeState({
    from,
    to,
    onChange,
    placeholder,
    disabled,
    align,
    t: propT,
  });

  return (
    <div
      className={`relative ${isFullWidth ? 'w-full' : 'inline-block'} text-left`}
      ref={containerRef}
    >
      <PlatformDateRangePickerTrigger
        disabled={disabled}
        isOpen={isOpen}
        toggleOpen={toggleOpen}
        variant={variant}
        className={className}
        isFullWidth={isFullWidth}
        isBlue={isBlue}
        hasValue={hasValue}
        displayText={displayText}
        clearable={clearable}
        handleClear={handleClear}
        lang={lang}
        t={t}
      />

      {isOpen && (
        <div
          role="dialog"
          aria-label={getPickerText('placeholderRange', lang, t)}
          className={`absolute z-50 mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl shadow-slate-900/10 dark:shadow-black/50 overflow-hidden flex flex-col w-[328px] sm:w-[496px] max-w-[calc(100vw-1.5rem)] animate-in fade-in zoom-95 duration-150 ${
            effectiveAlign === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          <div className="flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-slate-800">
            <PlatformDateRangePresets
              presets={presets}
              draftFrom={draftFrom}
              draftTo={draftTo}
              handlePresetClick={handlePresetClick}
              isBlue={isBlue}
              lang={lang}
              t={t}
            />

            <PlatformDateRangeCalendar
              monthTitle={monthTitle}
              shiftYear={shiftYear}
              shiftMonth={shiftMonth}
              weekdays={weekdays}
              days={days}
              effectiveFrom={effectiveFrom}
              effectiveTo={effectiveTo}
              todayIso={todayIso}
              minDate={minDate}
              maxDate={maxDate}
              isBlue={isBlue}
              handleDayClick={handleDayClick}
              handleDayMouseEnter={handleDayMouseEnter}
              handleDayMouseLeave={handleDayMouseLeave}
              lang={lang}
              t={t}
            />
          </div>

          <PlatformDateRangeFooter
            footerText={footerText}
            draftFrom={draftFrom}
            draftTo={draftTo}
            setDraftFrom={setDraftFrom}
            setDraftTo={setDraftTo}
            setSelectionStep={setSelectionStep}
            handleCancel={handleCancel}
            handleApply={handleApply}
            isBlue={isBlue}
            lang={lang}
            t={t}
          />
        </div>
      )}
    </div>
  );
}

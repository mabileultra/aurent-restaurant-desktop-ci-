import React from 'react';
import PlatformDatePickerCalendar from './PlatformDatePickerCalendar';
import PlatformDatePickerTrigger from './PlatformDatePickerTrigger';
import { usePlatformDatePickerState } from '../hooks/usePlatformDatePickerState';

export default function PlatformDatePicker({
  value = '',
  onChange,
  min = '',
  max = '',
  placeholder,
  className = '',
  disabled = false,
  clearable = true,
  quickDays = [7, 15, 30],
  align = 'left',
  variant = 'default',
  t: propT,
}) {
  const isAa = variant === 'aa';
  const isFullWidth = className.includes('w-full');

  const {
    t,
    lang,
    containerRef,
    isOpen,
    setIsOpen,
    toggleOpen,
    effectiveAlign,
    selectedIso,
    minIso,
    maxIso,
    todayIso,
    monthTitle,
    weekdays,
    days,
    hasValue,
    displayText,
    isTodayDisabled,
    handlePickDate,
    handleClear,
    handleQuickDay,
    shiftMonth,
    shiftYear,
  } = usePlatformDatePickerState({
    value,
    onChange,
    min,
    max,
    placeholder,
    disabled,
    quickDays,
    align,
    t: propT,
  });

  return (
    <div
      className={`relative ${isFullWidth ? 'w-full' : 'inline-block'} text-left`}
      ref={containerRef}
    >
      <PlatformDatePickerTrigger
        disabled={disabled}
        isOpen={isOpen}
        toggleOpen={toggleOpen}
        isAa={isAa}
        isFullWidth={isFullWidth}
        className={className}
        hasValue={hasValue}
        displayText={displayText}
        clearable={clearable}
        handleClear={handleClear}
        lang={lang}
        t={t}
      />

      {isOpen && (
        <PlatformDatePickerCalendar
          effectiveAlign={effectiveAlign}
          quickDays={quickDays}
          handleQuickDay={handleQuickDay}
          lang={lang}
          t={t}
          shiftYear={shiftYear}
          shiftMonth={shiftMonth}
          monthTitle={monthTitle}
          weekdays={weekdays}
          days={days}
          selectedIso={selectedIso}
          todayIso={todayIso}
          minIso={minIso}
          maxIso={maxIso}
          handlePickDate={handlePickDate}
          isTodayDisabled={isTodayDisabled}
          clearable={clearable}
          hasValue={hasValue}
          handleClear={handleClear}
          setIsOpen={setIsOpen}
        />
      )}
    </div>
  );
}

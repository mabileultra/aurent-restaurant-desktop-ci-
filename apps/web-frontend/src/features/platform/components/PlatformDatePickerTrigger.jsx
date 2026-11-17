import React from 'react';
import { Calendar, ChevronDown, X } from 'lucide-react';
import { getPickerText } from '../utils/platformDatePickerUtils';

export default function PlatformDatePickerTrigger({
  disabled,
  isOpen,
  toggleOpen,
  isAa,
  isFullWidth,
  className,
  hasValue,
  displayText,
  clearable,
  handleClear,
  lang,
  t,
}) {
  return (
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
      className={`group ${
        isAa
          ? 'h-10 sm:h-10 h-11 px-3 rounded-aa-md border border-aa-line-strong bg-aa-surface text-aa-ink text-xs sm:text-xs text-sm font-medium focus-within:ring-1 focus-within:ring-aa-primary shadow-none'
          : 'h-[2.375rem] px-3 rounded-[0.6rem] border border-slate-200 dark:border-slate-700 bg-white dark:!bg-slate-900 text-slate-800 dark:text-slate-100 text-xs font-medium hover:border-slate-300 dark:hover:border-slate-600 focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 shadow-sm'
      } inline-flex items-center justify-between gap-2.5 transition-all select-none ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      } ${isFullWidth ? 'w-full' : ''} ${className}`}
    >
      <span className="inline-flex items-center gap-2 truncate">
        <Calendar
          size={15}
          className={
            isAa
              ? 'text-aa-ink-muted shrink-0'
              : 'text-emerald-600 dark:text-emerald-400 shrink-0 group-hover:scale-105 transition-transform'
          }
        />
        <span
          className={`truncate ${
            isAa
              ? hasValue
                ? 'text-aa-ink font-medium'
                : 'text-aa-ink-subtle'
              : hasValue
                ? 'text-slate-900 dark:text-slate-100 font-semibold'
                : 'text-slate-400 dark:text-slate-500'
          }`}
        >
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
            className={`p-1 rounded-full ${
              isAa
                ? 'text-aa-ink-muted hover:text-aa-danger hover:bg-aa-surface-sunken'
                : 'text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            } transition-colors`}
          >
            <X size={12} strokeWidth={2.5} />
          </button>
        )}
        <ChevronDown
          size={14}
          className={`${
            isAa ? 'text-aa-ink-muted' : 'text-slate-400 dark:text-slate-500'
          } transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </span>
    </div>
  );
}

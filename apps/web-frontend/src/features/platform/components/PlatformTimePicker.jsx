import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Clock } from 'lucide-react';
import PlatformTimePickerDropdown from './PlatformTimePickerDropdown';
import {
  DEFAULT_PRESET_TIMES,
  DEFAULT_TIME,
  formatTimeString,
  getCurrentTimeString,
  parseTimeString,
} from '../utils/platformTimePickerUtils';

export default function PlatformTimePicker({
  value = DEFAULT_TIME,
  onChange,
  placeholder = DEFAULT_TIME,
  className = '',
  disabled = false,
  align = 'left',
  minuteStep = 5,
  presets = DEFAULT_PRESET_TIMES,
  size = 'sm',
  ariaLabel = 'Vaqtni tanlash',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const { hours, minutes, formatted } = useMemo(
    () => parseTimeString(value, DEFAULT_TIME),
    [value]
  );

  const selectedHour = useMemo(() => String(hours).padStart(2, '0'), [hours]);
  const selectedMinute = useMemo(() => String(minutes).padStart(2, '0'), [minutes]);

  // Click outside and Escape key listeners
  useEffect(() => {
    if (!isOpen) return undefined;

    const handleDocumentClick = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleDocumentClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleDocumentClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelectHour = (h) => {
    const nextVal = formatTimeString(h, selectedMinute);
    onChange?.(nextVal);
  };

  const handleSelectMinute = (m) => {
    const nextVal = formatTimeString(selectedHour, m);
    onChange?.(nextVal);
  };

  const handleSelectPreset = (presetTime) => {
    onChange?.(presetTime);
    setIsOpen(false);
  };

  const handleSelectNow = () => {
    const nowTime = getCurrentTimeString(minuteStep);
    onChange?.(nowTime);
    setIsOpen(false);
  };

  const sizeClasses = size === 'md' ? 'px-3.5 py-2 text-sm' : 'px-2.5 py-1.5 text-xs';

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label={ariaLabel}
        className={`inline-flex items-center gap-2 rounded-xl border transition-all cursor-pointer select-none font-medium ${
          isOpen
            ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-white dark:bg-slate-850'
            : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-850'
        } ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        } text-slate-800 dark:text-slate-100 ${sizeClasses}`}
      >
        <Clock size={13} className="text-slate-400 dark:text-slate-500 shrink-0" />
        <span className="font-semibold tracking-wide">
          {formatted || placeholder}
        </span>
        <ChevronDown
          size={12}
          className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <PlatformTimePickerDropdown
          selectedHour={selectedHour}
          selectedMinute={selectedMinute}
          onSelectHour={handleSelectHour}
          onSelectMinute={handleSelectMinute}
          presets={presets}
          onSelectPreset={handleSelectPreset}
          onSelectNow={handleSelectNow}
          onClose={() => setIsOpen(false)}
          align={align}
          minuteStep={minuteStep}
        />
      )}
    </div>
  );
}

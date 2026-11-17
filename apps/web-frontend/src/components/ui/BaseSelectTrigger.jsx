import React from 'react';
import clsx from 'clsx';
import { ChevronDown } from 'lucide-react';

export default function BaseSelectTrigger({
  triggerRef,
  fieldId,
  disabled,
  open,
  listId,
  error,
  displayLabel,
  placeholder,
  onClick,
  onKeyDown,
}) {
  return (
    <button
      ref={triggerRef}
      id={fieldId}
      type="button"
      disabled={disabled}
      aria-haspopup="listbox"
      aria-expanded={open}
      aria-controls={open ? listId : undefined}
      aria-invalid={Boolean(error)}
      aria-describedby={error ? `${fieldId}-error` : undefined}
      className="base-select__trigger"
      onClick={onClick}
      onKeyDown={onKeyDown}
    >
      <span
        className={clsx(
          'base-select__value',
          !displayLabel && placeholder && 'base-select__value--placeholder'
        )}
      >
        {displayLabel || placeholder || ''}
      </span>
      <ChevronDown size={16} className="base-select__chevron" aria-hidden />
    </button>
  );
}

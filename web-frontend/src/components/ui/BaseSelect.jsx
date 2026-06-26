import { forwardRef, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import { Check, ChevronDown } from 'lucide-react';
import { useBaseSelect } from './useBaseSelect';

function toOptionValue(value) {
  if (value === null || value === undefined) return '';
  return String(value);
}

function fireNativeChange(selectEl, nextValue) {
  if (!selectEl) return;
  selectEl.value = nextValue;
  selectEl.dispatchEvent(new Event('change', { bubbles: true }));
  selectEl.dispatchEvent(new Event('input', { bubbles: true }));
}

const BaseSelect = forwardRef(function BaseSelect(
  {
    label,
    error,
    required,
    options = [],
    placeholder = '',
    value,
    onChange,
    onBlur,
    name,
    id,
    disabled = false,
    className,
    size = 'md',
    emptyValue = '',
  },
  forwardedRef
) {
  const [open, setOpen] = useState(false);
  const nativeRef = useRef(null);
  const isControlled = value !== undefined;
  const [uncontrolledValue, setUncontrolledValue] = useState(emptyValue);

  useImperativeHandle(forwardedRef, () => nativeRef.current);

  useLayoutEffect(() => {
    if (isControlled) return;
    const el = nativeRef.current;
    if (!el) return;
    const domValue = toOptionValue(el.value ?? emptyValue);
    setUncontrolledValue((prev) => (prev !== domValue ? domValue : prev));
  });

  const effectiveValue = isControlled
    ? toOptionValue(value ?? emptyValue)
    : uncontrolledValue;

  const closeMenuRef = useRef(() => {});

  const commitSelection = (optionValue) => {
    if (!isControlled) {
      setUncontrolledValue(optionValue);
      fireNativeChange(nativeRef.current, optionValue);
    }
    onChange?.({ target: { value: optionValue, name } });
    closeMenuRef.current();
  };

  const selectedOption = useMemo(
    () => options.find((option) => toOptionValue(option.value) === effectiveValue),
    [effectiveValue, options]
  );

  const fieldId = id || name;
  const displayLabel = selectedOption?.label ?? (effectiveValue ? effectiveValue : '');

  const {
    listId,
    rootRef,
    triggerRef,
    menuRef,
    highlightIndex,
    setHighlightIndex,
    menuStyle,
    toggle,
    close,
  } = useBaseSelect({
    options,
    open,
    setOpen,
    disabled,
    onBlur,
    name,
    value: effectiveValue,
    onSelectOption: commitSelection,
  });

  closeMenuRef.current = close;

  const menu = open
    ? createPortal(
        <div
          ref={menuRef}
          id={listId}
          role="listbox"
          className="base-select__menu"
          style={{
            position: 'fixed',
            top: menuStyle.top,
            left: menuStyle.left,
            width: menuStyle.width,
          }}
        >
          {options.map((option, index) => {
            const optionValue = toOptionValue(option.value);
            const isSelected = optionValue === effectiveValue;
            const isHighlighted = index === highlightIndex;

            return (
              <button
                key={`${optionValue}-${index}`}
                type="button"
                role="option"
                aria-selected={isSelected}
                disabled={option.disabled}
                className={clsx(
                  'base-select__option',
                  isSelected && 'base-select__option--selected',
                  isHighlighted && 'base-select__option--highlight'
                )}
                onMouseEnter={() => setHighlightIndex(index)}
                onMouseDown={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  if (option.disabled) return;
                  commitSelection(optionValue);
                }}
              >
                <Check size={14} className="base-select__check" aria-hidden />
                <span className="base-select__option-label">{option.label}</span>
              </button>
            );
          })}
        </div>,
        document.body
      )
    : null;

  return (
    <div
      ref={rootRef}
      className={clsx(
        'base-select',
        size === 'sm' && 'base-select--sm',
        open && 'base-select--open',
        error && 'base-select--invalid',
        className
      )}
    >
      {label ? (
        <label htmlFor={fieldId} className="base-select__label">
          {required ? <span className="text-red-400">* </span> : null}
          {label}
        </label>
      ) : null}

      <button
        ref={triggerRef}
        id={fieldId}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        className="base-select__trigger"
        onClick={toggle}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            toggle();
          }
          if (event.key === 'ArrowDown' && !open) {
            event.preventDefault();
            setOpen(true);
          }
        }}
      >
        <span
          className={clsx(
            'base-select__value',
            !displayLabel && placeholder && 'base-select__value--placeholder'
          )}
        >
          {displayLabel || placeholder || '—'}
        </span>
        <ChevronDown size={16} className="base-select__chevron" aria-hidden />
      </button>

      <select
        ref={nativeRef}
        name={name}
        {...(isControlled ? { value: effectiveValue } : {})}
        disabled={disabled}
        className="base-select__native"
        tabIndex={-1}
        aria-hidden="true"
        onChange={onChange}
        onBlur={onBlur}
      >
        {options.map((option, index) => (
          <option key={`${toOptionValue(option.value)}-${index}`} value={toOptionValue(option.value)} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>

      {error ? <p className="base-select__error">{error}</p> : null}
      {menu}
    </div>
  );
});

export default BaseSelect;

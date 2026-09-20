import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import { Check, ChevronDown, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useBaseSelect } from './useBaseSelect';

function toOptionValue(value) {
  if (value === null || value === undefined) return '';
  return String(value);
}

function optionSearchText(option) {
  return [option?.label, option?.value, option?.keywords]
    .flat()
    .filter((part) => part != null && String(part).trim() !== '')
    .join(' ')
    .toLowerCase();
}

const BaseSelect = forwardRef(function BaseSelect(
  {
    label,
    error,
    required,
    options = [],
    placeholder = '',
    searchPlaceholder,
    emptyMessage,
    value,
    onChange,
    onBlur,
    name,
    id,
    disabled = false,
    className,
    size = 'md',
    emptyValue = '',
    searchable = true,
  },
  forwardedRef
) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const nativeRef = useRef(null);
  const searchRef = useRef(null);
  const isControlled = value !== undefined;
  const [uncontrolledValue, setUncontrolledValue] = useState(() => toOptionValue(emptyValue));

  const effectiveValue = isControlled
    ? toOptionValue(value ?? emptyValue)
    : uncontrolledValue;

  const closeMenuRef = useRef(() => {});

  const commitSelection = (optionValue) => {
    const next = toOptionValue(optionValue);
    if (!isControlled) {
      setUncontrolledValue(next);
    }
    // RHF register + setValue both read target.value / target.name
    onChange?.({
      type: 'change',
      target: { value: next, name: name || '' },
      currentTarget: { value: next, name: name || '' },
    });
    setQuery('');
    closeMenuRef.current();
  };

  const selectedOption = useMemo(
    () => options.find((option) => toOptionValue(option.value) === effectiveValue),
    [effectiveValue, options]
  );

  const fieldId = id || name;
  const displayLabel = selectedOption?.label ?? (effectiveValue ? effectiveValue : '');

  const visibleOptions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((option) => {
      if (toOptionValue(option.value) === '') return false;
      return optionSearchText(option).includes(q);
    });
  }, [options, query]);

  const {
    listId,
    rootRef,
    triggerRef,
    menuRef,
    highlightIndex,
    setHighlightIndex,
    menuStyle,
    close,
  } = useBaseSelect({
    options: visibleOptions,
    open,
    setOpen,
    disabled,
    onBlur,
    name,
    value: effectiveValue,
    onSelectOption: commitSelection,
  });

  const closeMenu = (opts) => {
    setQuery('');
    close(opts);
  };

  closeMenuRef.current = closeMenu;

  useEffect(() => {
    if (!open || !searchable) return undefined;
    const id = window.setTimeout(() => searchRef.current?.focus?.(), 0);
    return () => window.clearTimeout(id);
  }, [open, searchable]);

  useImperativeHandle(forwardedRef, () => ({
    get value() {
      return effectiveValue;
    },
    set value(next) {
      const normalized = toOptionValue(next ?? emptyValue);
      if (!isControlled) {
        setUncontrolledValue(normalized);
      }
      if (nativeRef.current) {
        nativeRef.current.value = normalized;
      }
    },
    focus() {
      triggerRef.current?.focus?.();
    },
    blur() {
      triggerRef.current?.blur?.();
    },
    get type() {
      return 'select-one';
    },
    get name() {
      return name;
    },
  }), [effectiveValue, emptyValue, isControlled, name]);

  const hasEmptyOption = options.some((option) => toOptionValue(option.value) === '');
  const searchPh = searchPlaceholder || t('common.search', { defaultValue: 'Поиск…' });

  const openMenu = () => {
    if (disabled) return;
    setOpen(true);
  };

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
          {searchable ? (
            <div className="base-select__search-wrap">
              <Search size={14} className="base-select__search-icon" aria-hidden />
              <input
                ref={searchRef}
                type="search"
                className="base-select__search"
                value={query}
                placeholder={searchPh}
                autoComplete="off"
                spellCheck={false}
                aria-autocomplete="list"
                aria-controls={listId}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (['ArrowDown', 'ArrowUp', 'Enter', 'Escape'].includes(event.key)) {
                    event.preventDefault();
                  }
                  event.stopPropagation();
                }}
                onMouseDown={(event) => event.stopPropagation()}
              />
            </div>
          ) : null}

          <div className="base-select__options">
            {visibleOptions.length === 0 ? (
              <div className="base-select__empty">{emptyMessage || t('platform.noSearchResults')}</div>
            ) : (
              visibleOptions.map((option, index) => {
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
              })
            )}
          </div>
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
        disabled && 'base-select--disabled',
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
        onClick={() => {
          if (disabled) return;
          if (open) closeMenu();
          else openMenu();
        }}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' && !open) {
            event.preventDefault();
            openMenu();
          }
        }}
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

      <select
        ref={nativeRef}
        name={name}
        value={effectiveValue}
        disabled={disabled}
        className="base-select__native"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(event) => {
          const next = toOptionValue(event.target.value);
          if (!isControlled) {
            setUncontrolledValue(next);
          }
          onChange?.(event);
        }}
        onBlur={onBlur}
      >
        {hasEmptyOption ? null : <option value="">{placeholder || ''}</option>}
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

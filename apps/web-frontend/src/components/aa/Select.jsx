import React, { useRef, useId, forwardRef } from 'react';
import clsx from 'clsx';
import { ChevronDown } from 'lucide-react';
import Field from './Field';
import SelectPanel from './select/SelectPanel';
import { useSelectPosition } from './select/useSelectPosition';
import { useSelectDropdown } from './select/useSelectDropdown';

/**
 * Aurent Admin — Select komponenti (o‘z ro‘yxatli maxsus global komponent).
 * Brauzerning standart <select> elementini to‘liq almashtiradi.
 */
const Select = forwardRef(function Select(
  {
    id: propId,
    label,
    optional = false,
    help,
    error,
    disabled = false,
    value,
    onChange,
    options = [],
    placeholder = 'Tanlang',
    searchable: propSearchable,
    name,
    className,
    size = 'md',
    ...props
  },
  forwardedRef
) {
  const generatedId = useId();
  const id = propId || `aa-select-${generatedId}`;
  const listboxId = `${id}-listbox`;
  const labelId = label ? `${id}-label` : id;

  const internalTriggerRef = useRef(null);
  const triggerRef = forwardedRef || internalTriggerRef;

  const isSearchable = propSearchable !== undefined
    ? Boolean(propSearchable)
    : options.length > 8;

  const {
    isOpen,
    searchQuery,
    handleSearchChange,
    activeIndex,
    panelRef,
    searchInputRef,
    filteredOptions,
    selectedOption,
    handleSelectOption,
    handleTriggerClick,
    handleTriggerKeyDown,
    handleListKeyDown,
  } = useSelectDropdown({
    options,
    value,
    onChange,
    disabled,
    isSearchable,
    triggerRef,
  });

  const position = useSelectPosition(triggerRef, isOpen, isSearchable);

  const hasField = Boolean(label || help || error);
  const helpId = id && help ? `${id}-help` : undefined;
  const errorId = id && error ? `${id}-error` : undefined;
  const describedBy = errorId || helpId || undefined;

  // Searchable rejimda fokus inputda bo‘ladi, shuning uchun triggerda activedescendant olib tashlanadi
  const triggerActiveDescendant = !isSearchable && isOpen && activeIndex >= 0
    ? `${id}-opt-${activeIndex}`
    : undefined;

  const displayLabel = selectedOption ? selectedOption.label : placeholder;
  const isPlaceholder = !selectedOption;

  const triggerElement = (
    <div className={clsx('aa-select', size === 'sm' && 'aa-select--sm', className)}>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        disabled={disabled}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-activedescendant={triggerActiveDescendant}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={describedBy}
        onClick={handleTriggerClick}
        onKeyDown={handleTriggerKeyDown}
        className={clsx(
          'aa-select__trigger',
          isOpen && 'aa-select__trigger--open',
          Boolean(error) && 'aa-select__trigger--error'
        )}
        {...props}
      >
        <span className={clsx('aa-select__value', isPlaceholder && 'aa-select__value--placeholder')}>
          {displayLabel}
        </span>
        <ChevronDown
          size={16}
          aria-hidden="true"
          className={clsx('aa-select__chevron', isOpen && 'aa-select__chevron--open')}
        />
      </button>

      {name && <input type="hidden" name={name} value={value ?? ''} />}

      <SelectPanel
        isOpen={isOpen}
        panelRef={panelRef}
        searchInputRef={searchInputRef}
        position={position}
        searchable={isSearchable}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onSearchKeyDown={handleListKeyDown}
        listboxId={listboxId}
        labelId={labelId}
        id={id}
        filteredOptions={filteredOptions}
        activeIndex={activeIndex}
        selectedValue={value}
        onSelectOption={handleSelectOption}
      />
    </div>
  );

  if (hasField) {
    return (
      <Field id={id} label={label} optional={optional} help={help} error={error}>
        {triggerElement}
      </Field>
    );
  }

  return triggerElement;
});

export default Select;

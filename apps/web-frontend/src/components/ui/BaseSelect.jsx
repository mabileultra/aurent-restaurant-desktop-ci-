import React, { forwardRef } from 'react';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { toOptionValue } from './baseSelectHelpers';
import BaseSelectMenuPortal from './BaseSelectMenuPortal';
import BaseSelectNativeSelect from './BaseSelectNativeSelect';
import BaseSelectTrigger from './BaseSelectTrigger';
import { useBaseSelectTriggerState } from './useBaseSelectTriggerState';

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
    menuClassName,
    size = 'md',
    variant = 'default',
    emptyValue = '',
    searchable = true,
    onSearchQueryChange,
    style,
  },
  forwardedRef
) {
  const { t } = useTranslation();

  const {
    open,
    query,
    setQuery,
    nativeRef,
    triggerRef,
    searchRef,
    fieldId,
    displayLabel,
    visibleOptions,
    commitSelection,
    closeMenu,
    openMenu,
    highlightIndex,
    setHighlightIndex,
    menuRef,
    rootRef,
    listId,
    menuStyle,
    effectiveValue,
    isControlled,
    setUncontrolledValue,
  } = useBaseSelectTriggerState({
    value,
    emptyValue,
    options,
    disabled,
    onBlur,
    name,
    onChange,
    onSearchQueryChange,
    searchable,
    forwardedRef,
    id,
  });

  const hasEmptyOption = options.some((option) => toOptionValue(option.value) === '');
  const searchPh = searchPlaceholder || t('common.search', { defaultValue: 'Поиск…' });
  const isAa = variant === 'aa';

  return (
    <div
      ref={rootRef}
      style={style}
      className={clsx(
        'base-select',
        isAa && 'base-select--aa',
        size === 'sm' && 'base-select--sm',
        open && 'base-select--open',
        disabled && 'base-select--disabled',
        error && 'base-select--invalid',
        className
      )}
    >
      {label ? (
        <label htmlFor={fieldId} className="base-select__label">
          {label}
          {required ? <span className="text-red-500"> *</span> : null}
        </label>
      ) : null}

      <BaseSelectTrigger
        triggerRef={triggerRef}
        fieldId={fieldId}
        disabled={disabled}
        open={open}
        listId={listId}
        error={error}
        displayLabel={displayLabel}
        placeholder={placeholder}
        onClick={() => {
          if (disabled) return;
          if (open) closeMenu();
          else openMenu();
        }}
        onKeyDown={(event) => {
          if (!open && ['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
            event.preventDefault();
            openMenu();
          }
        }}
      />

      <BaseSelectNativeSelect
        nativeRef={nativeRef}
        name={name}
        effectiveValue={effectiveValue}
        disabled={disabled}
        isControlled={isControlled}
        setUncontrolledValue={setUncontrolledValue}
        onChange={onChange}
        onBlur={onBlur}
        hasEmptyOption={hasEmptyOption}
        placeholder={placeholder}
        options={options}
      />

      {error ? <p id={`${fieldId}-error`} className="base-select__error">{error}</p> : null}

      <BaseSelectMenuPortal
        open={open}
        menuRef={menuRef}
        listId={listId}
        isAa={isAa}
        menuClassName={menuClassName}
        menuStyle={menuStyle}
        searchable={searchable}
        searchRef={searchRef}
        query={query}
        searchPh={searchPh}
        onQueryChange={(next) => {
          setQuery(next);
          onSearchQueryChange?.(next);
        }}
        highlightIndex={highlightIndex}
        setHighlightIndex={setHighlightIndex}
        visibleOptions={visibleOptions}
        commitSelection={commitSelection}
        closeMenu={closeMenu}
        emptyMessage={emptyMessage}
        emptyTextFallback={t('platform.noSearchResults')}
        effectiveValue={effectiveValue}
      />
    </div>
  );
});

export default BaseSelect;

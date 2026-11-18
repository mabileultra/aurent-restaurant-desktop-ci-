import { useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { filterVisibleOptions, toOptionValue } from './baseSelectHelpers';
import { useBaseSelect } from './useBaseSelect';

export function useBaseSelectTriggerState({
  value,
  emptyValue = '',
  options = [],
  disabled = false,
  onBlur,
  name,
  onChange,
  onSearchQueryChange,
  searchable = true,
  menuMinWidth = 280,
  forwardedRef,
  id,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const nativeRef = useRef(null);
  const searchRef = useRef(null);
  const isControlled = value !== undefined;
  const [uncontrolledValue, setUncontrolledValue] = useState(() => toOptionValue(emptyValue));

  const effectiveValue = isControlled ? toOptionValue(value ?? emptyValue) : uncontrolledValue;
  const closeMenuRef = useRef(() => {});

  const commitSelection = (optionValue) => {
    const next = toOptionValue(optionValue);
    if (!isControlled) {
      setUncontrolledValue(next);
    }
    onChange?.({
      type: 'change',
      target: { value: next, name: name || '' },
      currentTarget: { value: next, name: name || '' },
    });
    setQuery('');
    onSearchQueryChange?.('');
    closeMenuRef.current({ restoreFocus: true });
  };

  const selectedOption = useMemo(
    () => options.find((option) => toOptionValue(option.value) === effectiveValue),
    [effectiveValue, options]
  );

  const fieldId = id || name;
  const displayLabel = selectedOption?.label ?? (effectiveValue ? effectiveValue : '');
  const visibleOptions = useMemo(() => filterVisibleOptions(options, query), [options, query]);

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
    minWidth: menuMinWidth,
  });

  const closeMenu = (opts) => {
    setQuery('');
    onSearchQueryChange?.('');
    close(opts);
  };

  closeMenuRef.current = closeMenu;

  useEffect(() => {
    if (!open) {
      setQuery('');
      onSearchQueryChange?.('');
    }
  }, [open, onSearchQueryChange]);

  useEffect(() => {
    if (!open || !searchable) return undefined;
    const timeoutId = window.setTimeout(() => {
      searchRef.current?.focus?.();
      searchRef.current?.select?.();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [open, searchable]);

  useEffect(() => {
    if (!open) return;
    const enabledIdx = visibleOptions.findIndex((o) => !o.disabled);
    setHighlightIndex(enabledIdx >= 0 ? enabledIdx : 0);
  }, [query, open, visibleOptions, setHighlightIndex]);

  useEffect(() => {
    if (!open || highlightIndex < 0 || !menuRef.current) return;
    const item = menuRef.current.querySelector(`[data-index="${highlightIndex}"]`);
    item?.scrollIntoView?.({ block: 'nearest' });
  }, [highlightIndex, open, menuRef]);

  useImperativeHandle(
    forwardedRef,
    () => ({
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
      get name() {
        return name;
      },
    }),
    [effectiveValue, emptyValue, isControlled, name, triggerRef]
  );

  const openMenu = () => {
    if (disabled) return;
    setOpen(true);
  };

  return {
    open,
    setOpen,
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
  };
}

import { findNextEnabledIndex, findOptionStartingWith } from './selectUtils';

export function onTriggerKeyDown({
  e,
  isOpen,
  setIsOpen,
  disabled,
  isSearchable,
  options,
  filteredOptions,
  activeIndex,
  setActiveIndex,
  handleSelectOption,
  onChange,
}) {
  if (disabled) return;

  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault();
    if (!isOpen) {
      setIsOpen(true);
    } else {
      const dir = e.key === 'ArrowDown' ? 1 : -1;
      setActiveIndex((prev) => findNextEnabledIndex(filteredOptions, prev, dir));
    }
    return;
  }

  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    if (!isOpen) {
      setIsOpen(true);
    } else if (activeIndex >= 0 && filteredOptions[activeIndex] && !filteredOptions[activeIndex].disabled) {
      handleSelectOption(filteredOptions[activeIndex].value);
    }
    return;
  }

  if (e.key === 'Escape' && isOpen) {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(false);
    return;
  }

  // Qidiruvsiz rejimda birinchi harf bo‘yicha sakrash
  if (!isSearchable && !isOpen && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
    const matchIdx = findOptionStartingWith(options, e.key);
    if (matchIdx >= 0) {
      e.preventDefault();
      onChange?.(options[matchIdx].value);
    }
  }
}

export function onListKeyDown({
  e,
  setIsOpen,
  triggerRef,
  filteredOptions,
  activeIndex,
  setActiveIndex,
  handleSelectOption,
}) {
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    e.stopPropagation();
    setActiveIndex((prev) => findNextEnabledIndex(filteredOptions, prev, 1));
    return;
  }

  if (e.key === 'ArrowUp') {
    e.preventDefault();
    e.stopPropagation();
    setActiveIndex((prev) => findNextEnabledIndex(filteredOptions, prev, -1));
    return;
  }

  if (e.key === 'Home') {
    e.preventDefault();
    e.stopPropagation();
    const firstEnabled = filteredOptions.findIndex((opt) => !opt.disabled);
    if (firstEnabled >= 0) setActiveIndex(firstEnabled);
    return;
  }

  if (e.key === 'End') {
    e.preventDefault();
    e.stopPropagation();
    for (let i = filteredOptions.length - 1; i >= 0; i -= 1) {
      if (!filteredOptions[i].disabled) {
        setActiveIndex(i);
        break;
      }
    }
    return;
  }

  if (e.key === 'Enter') {
    e.preventDefault();
    e.stopPropagation();
    if (activeIndex >= 0 && filteredOptions[activeIndex] && !filteredOptions[activeIndex].disabled) {
      handleSelectOption(filteredOptions[activeIndex].value);
    }
    return;
  }

  if (e.key === 'Tab') {
    setIsOpen(false);
    return;
  }

  if (e.key === 'Escape') {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(false);
    triggerRef.current?.focus();
  }
}

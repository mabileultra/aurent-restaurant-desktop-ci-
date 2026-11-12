import { useState, useRef, useEffect, useMemo } from 'react';
import {
  filterSelectOptions,
  findNextEnabledIndex,
  findOptionStartingWith,
} from './selectUtils';

/**
 * useSelectDropdown — Select komponentining holati va hodisalarini boshqarish hooki.
 */
export function useSelectDropdown({
  options = [],
  value,
  onChange,
  disabled = false,
  isSearchable = false,
  triggerRef,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);

  const panelRef = useRef(null);
  const searchInputRef = useRef(null);

  // Qidiruv bo‘yicha filtrlangan variantlar
  const filteredOptions = useMemo(() => {
    return isSearchable ? filterSelectOptions(options, searchQuery) : options;
  }, [options, searchQuery, isSearchable]);

  // Tanlangan variant obyekti
  const selectedOption = useMemo(() => {
    return options.find((opt) => opt.value === value);
  }, [options, value]);

  // Ochilganda tanlangan variantga activeIndex o‘rnatish
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      const selectedIdx = filteredOptions.findIndex((opt) => opt.value === value && !opt.disabled);
      if (selectedIdx >= 0) {
        setActiveIndex(selectedIdx);
      } else {
        const firstEnabled = filteredOptions.findIndex((opt) => !opt.disabled);
        setActiveIndex(firstEnabled);
      }
    } else {
      setActiveIndex(-1);
    }
  }, [isOpen, value, filteredOptions]);

  // Tashqariga bosilganda yopish
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (e) => {
      if (
        triggerRef.current?.contains(e.target) ||
        panelRef.current?.contains(e.target)
      ) {
        return;
      }
      setIsOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, [isOpen, triggerRef]);

  const handleSelectOption = (optValue) => {
    onChange?.(optValue);
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  const handleTriggerClick = () => {
    if (disabled) return;
    setIsOpen((prev) => !prev);
  };

  const handleTriggerKeyDown = (e) => {
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
      } else if (activeIndex >= 0 && filteredOptions[activeIndex]) {
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
  };

  const handleListKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => findNextEnabledIndex(filteredOptions, prev, 1));
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => findNextEnabledIndex(filteredOptions, prev, -1));
      return;
    }

    if (e.key === 'Home') {
      e.preventDefault();
      const firstEnabled = filteredOptions.findIndex((opt) => !opt.disabled);
      if (firstEnabled >= 0) setActiveIndex(firstEnabled);
      return;
    }

    if (e.key === 'End') {
      e.preventDefault();
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
  };

  return {
    isOpen,
    setIsOpen,
    searchQuery,
    setSearchQuery,
    activeIndex,
    panelRef,
    searchInputRef,
    filteredOptions,
    selectedOption,
    handleSelectOption,
    handleTriggerClick,
    handleTriggerKeyDown,
    handleListKeyDown,
  };
}

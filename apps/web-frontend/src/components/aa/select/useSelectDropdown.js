import { useState, useRef, useEffect, useMemo } from 'react';
import { filterSelectOptions } from './selectUtils';
import { onTriggerKeyDown, onListKeyDown } from './selectKeyNavigation';

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
  const prevIsOpenRef = useRef(false);

  // Qidiruv bo‘yicha filtrlangan variantlar
  const filteredOptions = useMemo(() => {
    return isSearchable ? filterSelectOptions(options, searchQuery) : options;
  }, [options, searchQuery, isSearchable]);

  // Tanlangan variant obyekti
  const selectedOption = useMemo(() => {
    return options.find((opt) => opt.value === value);
  }, [options, value]);

  // 1. Faqat OCHILISH (false -> true) paytida query va activeIndex tiklanadi
  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      setSearchQuery('');
      const selectedIdx = options.findIndex((opt) => opt.value === value && !opt.disabled);
      if (selectedIdx >= 0) {
        setActiveIndex(selectedIdx);
      } else {
        const firstEnabled = options.findIndex((opt) => !opt.disabled);
        setActiveIndex(firstEnabled);
      }
    } else if (!isOpen && prevIsOpenRef.current) {
      setActiveIndex(-1);
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, value, options]);

  // 2. Qidiruv matni o‘zgarganda
  const handleSearchChange = (query) => {
    setSearchQuery(query);
    const nextFiltered = isSearchable ? filterSelectOptions(options, query) : options;
    const firstEnabled = nextFiltered.findIndex((opt) => !opt.disabled);
    setActiveIndex(firstEnabled);
  };

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
    onTriggerKeyDown({
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
    });
  };

  const handleListKeyDown = (e) => {
    onListKeyDown({
      e,
      setIsOpen,
      triggerRef,
      filteredOptions,
      activeIndex,
      setActiveIndex,
      handleSelectOption,
    });
  };

  return {
    isOpen,
    setIsOpen,
    searchQuery,
    setSearchQuery,
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
  };
}

import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import { Search, Check } from 'lucide-react';

/**
 * SelectPanel — Select variantlar ro‘yxati portali.
 */
export default function SelectPanel({
  isOpen,
  panelRef,
  searchInputRef,
  position,
  searchable,
  searchQuery,
  onSearchChange,
  onSearchKeyDown,
  listboxId,
  labelId,
  id,
  filteredOptions = [],
  activeIndex = -1,
  selectedValue,
  onSelectOption,
}) {
  const listRef = useRef(null);

  // Klaviatura bilan yurilganda yoki ochilganda aktiv variantga scroll qilish
  useEffect(() => {
    if (!isOpen || activeIndex < 0 || !listRef.current) return;
    const activeEl = listRef.current.children[activeIndex];
    if (activeEl && typeof activeEl.scrollIntoView === 'function') {
      activeEl.scrollIntoView({ block: 'nearest' });
    }
  }, [isOpen, activeIndex]);

  // Qidiruv maydoniga fokus berish
  useEffect(() => {
    if (isOpen && searchable && searchInputRef?.current) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 10);
      return () => clearTimeout(timer);
    }
  }, [isOpen, searchable, searchInputRef]);

  if (!isOpen) return null;
  if (typeof document === 'undefined') return null;

  const style = {
    top: position.top !== undefined ? `${position.top}px` : undefined,
    bottom: position.bottom !== undefined ? `${position.bottom}px` : undefined,
    left: `${position.left}px`,
    width: `${position.width}px`,
  };

  const activeOptionId = activeIndex >= 0 && filteredOptions[activeIndex]
    ? `${id}-opt-${activeIndex}`
    : undefined;

  const content = (
    <div
      ref={panelRef}
      style={style}
      className="aa-select__panel"
    >
      {searchable && (
        <div className="aa-select__search">
          <Search className="aa-select__search-icon" size={16} aria-hidden="true" />
          <input
            ref={searchInputRef}
            type="text"
            role="combobox"
            aria-expanded={isOpen}
            aria-controls={listboxId}
            aria-autocomplete="list"
            aria-activedescendant={activeOptionId}
            value={searchQuery}
            onChange={(e) => onSearchChange?.(e.target.value)}
            onKeyDown={onSearchKeyDown}
            placeholder="Qidirish…"
            className="aa-select__search-input"
            aria-label="Variantlarni qidirish"
          />
        </div>
      )}

      <ul
        ref={listRef}
        id={listboxId}
        role="listbox"
        aria-labelledby={labelId || id}
        className="aa-select__list"
        style={{ maxHeight: `${position.maxHeight}px` }}
        tabIndex={-1}
      >
        {filteredOptions.length === 0 ? (
          <li className="aa-select__empty" role="presentation">
            Hech narsa topilmadi
          </li>
        ) : (
          filteredOptions.map((opt, idx) => {
            const isSelected = opt.value === selectedValue;
            const isActive = idx === activeIndex;
            const optId = id ? `${id}-opt-${idx}` : undefined;

            return (
              <li
                key={opt.value ?? idx}
                id={optId}
                role="option"
                aria-selected={isSelected}
                aria-disabled={opt.disabled || undefined}
                className={clsx(
                  'aa-select__option',
                  isActive && 'aa-select__option--active',
                  isSelected && 'aa-select__option--selected',
                  opt.disabled && 'aa-select__option--disabled'
                )}
                onClick={() => {
                  if (!opt.disabled) {
                    onSelectOption?.(opt.value);
                  }
                }}
              >
                <span className="aa-select__option-label">{opt.label}</span>
                {isSelected && (
                  <Check className="aa-select__option-check" size={16} aria-hidden="true" />
                )}
              </li>
            );
          })
        )}
      </ul>
    </div>
  );

  return createPortal(content, document.body);
}

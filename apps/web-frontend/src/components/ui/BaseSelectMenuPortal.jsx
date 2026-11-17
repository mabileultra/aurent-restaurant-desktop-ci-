import React from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import { Check, Search } from 'lucide-react';
import { toOptionValue } from './baseSelectHelpers';

export default function BaseSelectMenuPortal({
  open,
  menuRef,
  listId,
  isAa,
  menuClassName,
  menuStyle,
  searchable,
  searchRef,
  query,
  searchPh,
  onQueryChange,
  highlightIndex,
  setHighlightIndex,
  visibleOptions,
  commitSelection,
  closeMenu,
  emptyMessage,
  emptyTextFallback,
  effectiveValue,
}) {
  if (!open) return null;

  return createPortal(
    <div
      ref={menuRef}
      id={listId}
      role="listbox"
      className={clsx('base-select__menu', isAa && 'base-select__menu--aa', menuClassName)}
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
            onChange={(event) => {
              onQueryChange(event.target.value);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                event.stopPropagation();
                const targetIdx = highlightIndex >= 0 ? highlightIndex : 0;
                if (visibleOptions[targetIdx] && !visibleOptions[targetIdx].disabled) {
                  commitSelection(visibleOptions[targetIdx].value);
                }
                return;
              }
              if (event.key === 'Tab') {
                closeMenu();
                return;
              }
              if (['ArrowDown', 'ArrowUp', 'Escape'].includes(event.key)) {
                return;
              }
              event.stopPropagation();
            }}
            onMouseDown={(event) => event.stopPropagation()}
          />
        </div>
      ) : null}

      <div className="base-select__options">
        {visibleOptions.length === 0 ? (
          <div className="base-select__empty">{emptyMessage || emptyTextFallback}</div>
        ) : (
          visibleOptions.map((option, index) => {
            const optionValue = toOptionValue(option.value);
            const isSelected = optionValue !== '' && optionValue === effectiveValue;
            const isHighlighted = index === highlightIndex;

            return (
              <button
                key={`${optionValue}-${index}`}
                data-index={index}
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
  );
}

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
  if (!open || typeof document === 'undefined') return null;

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
        minWidth: menuStyle.width,
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
              if (event.key === 'Escape') {
                event.preventDefault();
                event.stopPropagation();
                event.nativeEvent?.stopImmediatePropagation?.();
                closeMenu({ restoreFocus: true });
                return;
              }
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
              if (['ArrowDown', 'ArrowUp'].includes(event.key)) {
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

            const q = (query || '').trim().toLowerCase();
            const legalNameStr = option.legalName ? String(option.legalName).trim() : '';
            const isLegalMatched = q.length > 0 && legalNameStr.toLowerCase().includes(q);
            const isLegalDifferent = legalNameStr && legalNameStr.toLowerCase() !== String(option.name || '').trim().toLowerCase();
            const shouldShowLegalName = Boolean(option.subLabel || (isLegalMatched && isLegalDifferent));
            const subLabelText = option.subLabel || (shouldShowLegalName ? legalNameStr : null);

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
                <div className="flex flex-col min-w-0 text-left">
                  <span className="base-select__option-label truncate" title={option.label}>
                    {option.label}
                  </span>
                  {subLabelText ? (
                    <span className="text-[11px] text-aa-ink-muted truncate" title={subLabelText}>
                      {subLabelText}
                    </span>
                  ) : null}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>,
    document.body
  );
}

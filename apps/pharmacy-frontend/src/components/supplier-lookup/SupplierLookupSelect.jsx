import { useTranslation } from 'react-i18next';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import { Search, X } from 'lucide-react';
import { useSupplierLookupSelect } from './useSupplierLookupSelect';
import '../../styles/shared/product-lookup-select.css';

export default function SupplierLookupSelect({
  value = '',
  onChange,
  label,
  error,
  required = false,
  placeholder,
  disabled = false,
  className,
  name,
  id,
  onBlur,
}) {
  const { t } = useTranslation();
  const normalizedValue = value ? String(value) : '';
  const fieldId = id || name;

  const {
    listId,
    rootRef,
    inputRef,
    menuRef,
    open,
    openMenu,
    close,
    query,
    setQuery,
    debouncedQuery,
    candidates,
    selectedSupplier,
    searchLoading,
    highlightIndex,
    setHighlightIndex,
    menuStyle,
  } = useSupplierLookupSelect({
    value: normalizedValue,
    disabled,
    onBlur,
    name,
  });

  const placeholderText = placeholder ?? t('finance.expenses.counterpartyPlaceholder');
  const searchPlaceholder = t('finance.expenses.counterpartySearch');

  const showSelectedChip = !open && normalizedValue && selectedSupplier;
  const inputPlaceholder = open ? searchPlaceholder : showSelectedChip ? '' : placeholderText;

  const pickSupplier = (supplier) => {
    const nextValue = String(supplier.id);
    onChange?.({ target: { value: nextValue, name } });
    close();
    inputRef.current?.blur();
  };

  const clearSelection = (event) => {
    event.stopPropagation();
    onChange?.({ target: { value: '', name } });
    close();
  };

  const menu = open
    ? createPortal(
        <div
          ref={menuRef}
          id={listId}
          role="listbox"
          className="product-lookup__menu"
          style={{
            position: 'fixed',
            top: menuStyle.top,
            left: menuStyle.left,
            width: menuStyle.width,
            zIndex: 9999,
          }}
        >
          {searchLoading ? (
            <p className="product-lookup__empty">{t('common.loading')}</p>
          ) : candidates.length === 0 ? (
            <p className="product-lookup__empty">{t('finance.expenses.counterpartyEmpty')}</p>
          ) : (
            candidates.map((supplier, index) => {
              const isSelected = String(supplier.id) === normalizedValue;
              const isHighlighted = index === highlightIndex;
              return (
                <button
                  key={supplier.id}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className={clsx(
                    'product-lookup__option',
                    isHighlighted && 'product-lookup__option--highlight',
                  )}
                  onMouseEnter={() => setHighlightIndex(index)}
                  onClick={() => pickSupplier(supplier)}
                >
                  <span className="product-lookup__option-name">{supplier.name}</span>
                  {supplier.taxId ? (
                    <span className="product-lookup__option-meta">{supplier.taxId}</span>
                  ) : null}
                </button>
              );
            })
          )}
        </div>,
        document.body,
      )
    : null;

  return (
    <div
      ref={rootRef}
      className={clsx(
        'product-lookup',
        open && 'product-lookup--open',
        disabled && 'product-lookup--disabled',
        error && 'product-lookup--invalid',
        className,
      )}
    >
      {label ? (
        <label htmlFor={fieldId} className="product-lookup__label">
          {required ? <span className="text-red-400">* </span> : null}
          {label}
        </label>
      ) : null}

      <div
        className="product-lookup__control"
        onClick={() => {
          if (disabled) return;
          if (!open) openMenu();
          inputRef.current?.focus();
        }}
        onKeyDown={(event) => {
          if (disabled) return;
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            if (!open) openMenu();
          }
          if (event.key === 'Escape') close();
          if (event.key === 'ArrowDown' && !open) {
            event.preventDefault();
            openMenu();
          }
          if (open && event.key === 'ArrowDown') {
            event.preventDefault();
            setHighlightIndex((prev) => Math.min(prev + 1, candidates.length - 1));
          }
          if (open && event.key === 'ArrowUp') {
            event.preventDefault();
            setHighlightIndex((prev) => Math.max(prev - 1, 0));
          }
          if (open && event.key === 'Enter' && highlightIndex >= 0 && candidates[highlightIndex]) {
            event.preventDefault();
            pickSupplier(candidates[highlightIndex]);
          }
        }}
        role="combobox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        tabIndex={disabled ? -1 : 0}
      >
        <Search size={16} className="product-lookup__icon" aria-hidden />
        {showSelectedChip ? (
          <span className="product-lookup__chip">
            <span className="product-lookup__chip-label">{selectedSupplier.name}</span>
            <button
              type="button"
              className="product-lookup__chip-clear"
              onClick={clearSelection}
              aria-label={t('common.cancel')}
            >
              <X size={14} />
            </button>
          </span>
        ) : null}
        <input
          ref={inputRef}
          id={fieldId}
          name={name}
          type="text"
          className="product-lookup__input"
          value={open ? query : ''}
          placeholder={inputPlaceholder}
          disabled={disabled}
          autoComplete="off"
          onChange={(e) => setQuery(e.target.value)}
          onFocus={openMenu}
        />
      </div>

      {error ? <p className="product-lookup__error">{error}</p> : null}
      {menu}
    </div>
  );
}

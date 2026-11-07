import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { Search, X } from 'lucide-react';
import { useProductLookupSelect } from './useProductLookupSelect';
import ProductLookupMenu from './ProductLookupMenu';

export default function ProductLookupSelect({
  value = '',
  onChange,
  onProductSelect,
  storeId,
  label,
  error,
  required = false,
  placeholder,
  disabled = false,
  className,
  size = 'md',
  minSearchLength = 2,
  name,
  id,
  onBlur,
  showStockInList = true,
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
    minSearchLength: minLen,
    candidates,
    selectedProduct,
    searchLoading,
    highlightIndex,
    setHighlightIndex,
    menuStyle,
  } = useProductLookupSelect({
    value: normalizedValue,
    storeId,
    minSearchLength,
    disabled,
    onBlur,
    name,
  });

  const placeholderText = placeholder ?? t('stockReports.pickProduct');
  const searchPlaceholder = t('stockReports.lifecycleSearchPlaceholder');

  const showSelectedChip = !open && normalizedValue && selectedProduct;
  const inputPlaceholder = open ? searchPlaceholder : showSelectedChip ? '' : placeholderText;

  const pickProduct = (product) => {
    const nextValue = String(product.id);
    onChange?.({ target: { value: nextValue, name } });
    onProductSelect?.(product);
    close();
    inputRef.current?.blur();
  };

  const clearSelection = (event) => {
    event.stopPropagation();
    onChange?.({ target: { value: '', name } });
    onProductSelect?.(null);
    setQuery('');
    openMenu();
    inputRef.current?.focus();
  };

  const handleEnter = (event) => {
    if (event.key !== 'Enter') return;
    if (!open || highlightIndex < 0 || !candidates[highlightIndex]) return;
    event.preventDefault();
    pickProduct(candidates[highlightIndex]);
  };

  const showMenu = open && debouncedQuery.length >= minLen;

  const minCharsHint =
    open && query.trim().length > 0 && query.trim().length < minLen ? (
      <p className="product-lookup__min-hint">
        {t('productLookup.minChars', { count: minLen })}
      </p>
    ) : null;

  return (
    <div
      ref={rootRef}
      className={clsx(
        'product-lookup',
        size === 'sm' && 'product-lookup--sm',
        open && 'product-lookup--open',
        disabled && 'product-lookup--disabled',
        error && 'product-lookup--invalid',
        className
      )}
    >
      {label ? (
        <label htmlFor={fieldId} className="product-lookup__label">
          {required ? <span className="text-red-400">* </span> : null}
          {label}
        </label>
      ) : null}
      <div className="product-lookup__control">
        <Search size={16} className="product-lookup__icon" aria-hidden />
        {showSelectedChip ? (
          <div className="product-lookup__chip">
            <span className="product-lookup__chip-name">{selectedProduct.name}</span>
            <span className="product-lookup__chip-meta">{selectedProduct.sku}</span>
          </div>
        ) : null}
        <input
          ref={inputRef}
          id={fieldId}
          type="text"
          name={name}
          disabled={disabled}
          value={open ? query : ''}
          placeholder={inputPlaceholder}
          className="product-lookup__input"
          aria-expanded={open}
          aria-controls={showMenu ? listId : undefined}
          aria-autocomplete="list"
          onFocus={openMenu}
          onChange={(event) => {
            setQuery(event.target.value);
            if (!open) openMenu();
          }}
          onKeyDown={handleEnter}
        />
        {normalizedValue && !disabled ? (
          <button
            type="button"
            className="product-lookup__clear"
            onClick={clearSelection}
            aria-label={t('common.close')}
          >
            <X size={14} />
          </button>
        ) : null}
      </div>
      {minCharsHint}
      {error ? <p className="product-lookup__error">{error}</p> : null}
      <ProductLookupMenu
        showMenu={showMenu}
        menuRef={menuRef}
        listId={listId}
        menuStyle={menuStyle}
        searchLoading={searchLoading}
        candidates={candidates}
        normalizedValue={normalizedValue}
        highlightIndex={highlightIndex}
        setHighlightIndex={setHighlightIndex}
        onPickProduct={pickProduct}
        showStockInList={showStockInList}
      />
    </div>
  );
}

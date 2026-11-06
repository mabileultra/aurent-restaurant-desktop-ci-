import { useTranslation } from 'react-i18next';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import { Search, X } from 'lucide-react';
import { useProductLookupSelect } from './useProductLookupSelect';
import '../../styles/shared/product-lookup-select.css';

function productTypeLabel(product, t) {
  if (product.productType === 'RETAIL') return t('rst.nomenclature.typeProduct');
  if (product.productType === 'MATERIAL') return t('rst.nomenclature.typeIngredient');
  return product.productType || '';
}

function formatProductMeta(product, t, showStock) {
  const parts = [
    productTypeLabel(product, t),
    product.barcode || product.sku,
  ].filter(Boolean);
  if (showStock && product.stockQuantity != null) {
    parts.push(`${product.stockQuantity} ${t('stockReports.unitsSuffix')}`);
  }
  return parts.join(' · ');
}

function formatSelectedMeta(product, t) {
  const parts = [
    productTypeLabel(product, t),
    product.barcode || (product.sku && !String(product.sku).startsWith('IKPU-') ? product.sku : null),
  ].filter(Boolean);
  if (product.stockQuantity != null) {
    parts.push(`${t('stockReports.colStock', { defaultValue: 'Остаток' })}: ${product.stockQuantity}`);
  }
  return parts.join(' · ');
}

export default function ProductLookupSelect({
  value = '',
  onChange,
  onProductSelect,
  storeId,
  source = 'warehouse',
  label,
  error,
  required = false,
  placeholder,
  disabled = false,
  className,
  size = 'md',
  minSearchLength = 0,
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
    searchError,
    highlightIndex,
    setHighlightIndex,
    menuStyle,
    canSearch,
  } = useProductLookupSelect({
    value: normalizedValue,
    storeId,
    source,
    minSearchLength,
    disabled,
    onBlur,
    name,
  });

  const placeholderText = placeholder ?? t('stockReports.pickProduct');
  const searchPlaceholder = t('productLookup.searchPh', {
    defaultValue: t('stockReports.lifecycleSearchPlaceholder'),
  });

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

  const showMenu = open && canSearch;

  const menu = showMenu
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
          }}
        >
          {searchLoading && (
            <p className="product-lookup__hint">{t('common.loading')}</p>
          )}
          {searchError && !searchLoading ? (
            <p className="product-lookup__hint">
              {t('productLookup.loadFailed', { defaultValue: t('common.loadError') })}
            </p>
          ) : null}
          {!searchLoading && !searchError && candidates.length === 0 && (
            <p className="product-lookup__hint">
              {debouncedQuery
                ? t('productLookup.emptyWithCreate', {
                    defaultValue: t('stockReports.lifecycleSearchEmpty'),
                  })
                : t('productLookup.emptyCatalog', {
                    defaultValue: t('rst.nomenclature.empty'),
                  })}
            </p>
          )}
          {!searchLoading &&
            candidates.map((product, index) => (
              <button
                key={product.id}
                type="button"
                role="option"
                aria-selected={String(product.id) === normalizedValue}
                className={clsx(
                  'product-lookup__option',
                  index === highlightIndex && 'product-lookup__option--highlight'
                )}
                onMouseEnter={() => setHighlightIndex(index)}
                onClick={() => pickProduct(product)}
              >
                <span className="product-lookup__option-name">{product.name}</span>
                <span className="product-lookup__option-meta">
                  {formatProductMeta(product, t, showStockInList)}
                </span>
              </button>
            ))}
        </div>,
        document.body
      )
    : null;

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
        showSelectedChip && 'product-lookup--selected',
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
          <button
            type="button"
            className="product-lookup__chip"
            onClick={openMenu}
          >
            <span className="product-lookup__chip-name">{selectedProduct.name}</span>
            <span className="product-lookup__chip-meta">
              {formatSelectedMeta(selectedProduct, t)}
            </span>
          </button>
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
      {menu}
    </div>
  );
}

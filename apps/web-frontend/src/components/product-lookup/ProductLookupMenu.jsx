import { createPortal } from 'react-dom';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';

export function formatProductMeta(product, t) {
  const parts = [product.sku];
  if (product.barcode) parts.push(product.barcode);
  if (product.stockQuantity != null) {
    parts.push(`${product.stockQuantity} ${t('stockReports.unitsSuffix')}`);
  }
  return parts.join(' · ');
}

export default function ProductLookupMenu({
  showMenu,
  menuRef,
  listId,
  menuStyle,
  searchLoading,
  candidates,
  normalizedValue,
  highlightIndex,
  setHighlightIndex,
  onPickProduct,
  showStockInList = true,
}) {
  const { t } = useTranslation();

  if (!showMenu) return null;

  return createPortal(
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
      {!searchLoading && candidates.length === 0 && (
        <p className="product-lookup__hint">{t('stockReports.lifecycleSearchEmpty')}</p>
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
            onClick={() => onPickProduct(product)}
          >
            <span className="product-lookup__option-name">{product.name}</span>
            <span className="product-lookup__option-meta">
              {formatProductMeta(
                {
                  ...product,
                  stockQuantity: showStockInList ? product.stockQuantity : undefined,
                },
                t
              )}
            </span>
          </button>
        ))}
    </div>,
    document.body
  );
}

import { createPortal } from 'react-dom';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';

export default function SupplierLookupMenu({
  open,
  listId,
  menuRef,
  menuStyle,
  searchLoading,
  candidates,
  normalizedValue,
  highlightIndex,
  setHighlightIndex,
  onPickSupplier,
}) {
  const { t } = useTranslation();

  if (!open) return null;

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
              onClick={() => onPickSupplier(supplier)}
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
  );
}

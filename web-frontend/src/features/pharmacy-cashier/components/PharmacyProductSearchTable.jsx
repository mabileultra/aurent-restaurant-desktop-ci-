import { forwardRef, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { fmtMoney as fmt } from '../../../utils/formatMoney';
import { formatQty } from '../../../utils/quantityFormat';
import { resolveProductUnitPrice } from '../../../utils/productPrice';
import {
  daysUntilExpiry,
  formatExpiryDisplay,
  productBatch,
  productDosageForm,
  productExpiry,
  productRequiresPrescription,
  productSellByUnitHint,
  productShelfLifeDays,
  productStorageLocation,
} from '../utils/pharmacyProductMeta';
import {
  pharmacyCellToneClass,
  pharmacyExpiryTone,
  pharmacyShelfTone,
  pharmacyStockTone,
} from '../utils/pharmacyCellTone';
import '../styles/pharmacy-search-table.css';

function formatStockExpiryDays(daysLeft, shelfLife, daysLabel) {
  if (daysLeft == null) return '—';
  if (shelfLife != null) return `${daysLeft}/${shelfLife} ${daysLabel}`;
  return `${daysLeft} ${daysLabel}`;
}

/**
 * Остатки склада аптеки — колонки как в макете (только pharmacy-cashier).
 */
const PharmacyProductSearchTable = forwardRef(function PharmacyProductSearchTable(
  {
    storeId,
    search,
    onSearchChange,
    onSearchEnter,
    products,
    productsLoading,
    productsStale = false,
    productsError,
    productsLoadingMore,
    productsHasMore,
    onLoadMore,
    onSelectProduct,
    scanDisabled,
    hideSearchField = false,
  },
  ref,
) {
  const { t } = useTranslation();
  const sentinelRef = useRef(null);
  const daysLabel = t('pharmacyCashier.daysShort');

  useEffect(() => {
    if (!productsHasMore || productsLoadingMore || productsStale || !onLoadMore) return undefined;
    const node = sentinelRef.current;
    if (!node) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) onLoadMore();
      },
      { root: node.parentElement, rootMargin: '80px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [productsHasMore, productsLoadingMore, productsStale, onLoadMore, products.length]);

  return (
    <div className={`pharmacy-search${productsStale ? ' is-stale' : ''}`}>
      {!hideSearchField ? (
        <div className="pharmacy-search__field-wrap">
          <input
            ref={ref}
            type="search"
            className="pharmacy-search__field"
            value={search}
            disabled={scanDisabled}
            placeholder={t('pharmacyCashier.searchPh')}
            aria-label={t('pos.searchProducts')}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                onSearchEnter?.();
              }
            }}
          />
        </div>
      ) : null}

      <div className="pharmacy-search__scroll">
        {productsError ? (
          <p className="pharmacy-search__status" role="alert">
            {t('common.loadError')}
          </p>
        ) : productsLoading && products.length === 0 ? (
          <p className="pharmacy-search__status">{t('common.loading')}</p>
        ) : products.length === 0 ? (
          <p className="pharmacy-search__empty">
            {search.trim()
              ? t('pharmacyCashier.noProductsMatch')
              : t('pharmacyCashier.searchHint')}
          </p>
        ) : (
          <table className="pharmacy-search__table pharmacy-search__table--stock">
            <thead>
              <tr>
                <th>{t('pharmacyCashier.colName')}</th>
                <th>{t('pharmacyCashier.colForm')}</th>
                <th>{t('pharmacyCashier.colShelf')}</th>
                <th className="pharmacy-search__num">{t('pharmacyCashier.colPrice')}</th>
                <th className="pharmacy-search__num">{t('pharmacyCashier.colStock')}</th>
                <th>{t('pharmacyCashier.colExpiryDays')}</th>
                <th>{t('pharmacyCashier.colBatch')}</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const outOfStock =
                  (product.saleType || 'PIECE') !== 'SERVICE'
                  && Number(product.stockQuantity) <= 0;
                const inactive = product.active === false;
                const disabled = outOfStock || inactive || productsStale;
                const form = productDosageForm(product) || '—';
                const shelf = productStorageLocation(product) || '—';
                const batch = productBatch(product) || '—';
                const expiryDate = formatExpiryDisplay(productExpiry(product));
                const sellByUnit = productSellByUnitHint(product);
                const stockTone = disabled ? null : pharmacyStockTone(product);
                const shelfTone = disabled ? null : pharmacyShelfTone(product);
                const expiryTone = disabled ? null : pharmacyExpiryTone(product);
                const needsRx = productRequiresPrescription(product);
                const daysLeft = daysUntilExpiry(productExpiry(product));
                const shelfLife = productShelfLifeDays(product);
                const daysLabelText = formatStockExpiryDays(daysLeft, shelfLife, daysLabel);
                const meta = [
                  expiryDate ? `${t('pharmacyCashier.colExpiryShort')}: ${expiryDate}` : '',
                  sellByUnit ? t('pharmacyCashier.sellByUnitHintShort') : '',
                ].filter(Boolean).join(' · ');

                return (
                  <tr
                    key={product.id}
                    className={[
                      'pharmacy-search__row',
                      disabled ? 'is-disabled' : '',
                      needsRx ? 'is-recipe' : '',
                    ].filter(Boolean).join(' ')}
                    onClick={() => {
                      if (!disabled) onSelectProduct(product);
                    }}
                  >
                    <td className="pharmacy-search__name" title={product.name}>
                      <div className="pharmacy-search__name-block">
                        <span className="pharmacy-search__cell-text pharmacy-search__cell-text--name">
                          {product.name}
                        </span>
                        {needsRx ? (
                          <span className="pharmacy-search__recipe-tag">
                            {t('pharmacyCashier.recipeTag')}
                          </span>
                        ) : null}
                        {meta ? (
                          <span className="pharmacy-search__name-meta">{meta}</span>
                        ) : null}
                      </div>
                    </td>
                    <td className="pharmacy-search__mono pharmacy-search__clip" title={form}>
                      <span className="pharmacy-search__cell-text">{form}</span>
                    </td>
                    <td
                      className={[
                        'pharmacy-search__mono',
                        pharmacyCellToneClass(shelfTone, 'pharmacy-search__cell'),
                      ].filter(Boolean).join(' ')}
                    >
                      <span className="pharmacy-search__badge">{shelf}</span>
                    </td>
                    <td className="pharmacy-search__num">
                      {fmt(resolveProductUnitPrice(product, storeId))}
                    </td>
                    <td
                      className={[
                        'pharmacy-search__num',
                        pharmacyCellToneClass(stockTone, 'pharmacy-search__cell'),
                      ].filter(Boolean).join(' ')}
                    >
                      <span className="pharmacy-search__badge">
                        {formatQty(product.stockQuantity ?? 0, product.saleType, product.unitCode)}
                      </span>
                    </td>
                    <td
                      className={[
                        'pharmacy-search__mono',
                        pharmacyCellToneClass(expiryTone, 'pharmacy-search__cell'),
                      ].filter(Boolean).join(' ')}
                      title={expiryDate || undefined}
                    >
                      <span className="pharmacy-search__badge">{daysLabelText}</span>
                    </td>
                    <td className="pharmacy-search__mono pharmacy-search__clip" title={batch}>
                      <span className="pharmacy-search__cell-text">{batch}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        {productsHasMore ? <div ref={sentinelRef} aria-hidden /> : null}
      </div>

      {productsHasMore ? (
        <div className="pharmacy-search__more">
          <button
            type="button"
            className="pharmacy-search__more-btn"
            disabled={productsLoadingMore}
            onClick={() => onLoadMore?.()}
          >
            {productsLoadingMore
              ? t('pos.loadingMoreProducts')
              : t('pos.scrollForMoreProducts')}
          </button>
        </div>
      ) : null}
    </div>
  );
});

export default PharmacyProductSearchTable;

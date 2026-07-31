import { forwardRef, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { fmtMoney as fmt } from '../../../utils/formatMoney';
import { formatQty } from '../../../utils/quantityFormat';
import { resolveProductUnitPrice } from '../../../utils/productPrice';
import {
  formatExpiryDisplay,
  productBatch,
  productExpiry,
  pharmacyRowStatus,
  pharmacyRowStatusClass,
} from '../utils/pharmacyProductMeta';
import '../styles/pharmacy-search-table.css';

const PharmacyProductSearchTable = forwardRef(function PharmacyProductSearchTable(
  {
    storeId,
    search,
    onSearchChange,
    onSearchEnter,
    products,
    productsLoading,
    productsError,
    productsLoadingMore,
    productsHasMore,
    onLoadMore,
    onSelectProduct,
    scanDisabled,
  },
  ref,
) {
  const { t } = useTranslation();
  const sentinelRef = useRef(null);

  useEffect(() => {
    if (!productsHasMore || productsLoadingMore || !onLoadMore) return undefined;
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
  }, [productsHasMore, productsLoadingMore, onLoadMore, products.length]);

  return (
    <div className="pharmacy-search">
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
          <table className="pharmacy-search__table">
            <thead>
              <tr>
                <th>{t('pharmacyCashier.colName')}</th>
                <th className="pharmacy-search__num">{t('pharmacyCashier.colPrice')}</th>
                <th className="pharmacy-search__num">{t('pharmacyCashier.colStock')}</th>
                <th>{t('pharmacyCashier.colIkpu')}</th>
                <th>{t('pharmacyCashier.colExpiry')}</th>
                <th>{t('pharmacyCashier.colBatch')}</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const outOfStock =
                  (product.saleType || 'PIECE') !== 'SERVICE'
                  && Number(product.stockQuantity) <= 0;
                const inactive = product.active === false;
                const disabled = outOfStock || inactive;
                const status = disabled ? null : pharmacyRowStatus(product);
                const statusClass = pharmacyRowStatusClass(status, 'pharmacy-search__row');
                const expiry = formatExpiryDisplay(productExpiry(product)) || '—';
                const batch = productBatch(product) || '—';
                return (
                  <tr
                    key={product.id}
                    className={[
                      'pharmacy-search__row',
                      statusClass,
                      disabled ? 'is-disabled' : '',
                    ].filter(Boolean).join(' ')}
                    onClick={() => {
                      if (!disabled) onSelectProduct(product);
                    }}
                  >
                    <td className="pharmacy-search__name">{product.name}</td>
                    <td className="pharmacy-search__num">
                      {fmt(resolveProductUnitPrice(product, storeId))}
                    </td>
                    <td className="pharmacy-search__num pharmacy-search__stock">
                      {formatQty(product.stockQuantity ?? 0, product.saleType, product.unitCode)}
                    </td>
                    <td className="pharmacy-search__mono">{product.ikpu || '—'}</td>
                    <td className="pharmacy-search__mono pharmacy-search__expiry">{expiry}</td>
                    <td className="pharmacy-search__mono">{batch}</td>
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

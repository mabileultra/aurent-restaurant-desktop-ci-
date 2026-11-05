import { forwardRef, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import PharmacyProductSearchTableRow from './PharmacyProductSearchTableRow';
import '../styles/pharmacy-search-table.css';
import '../styles/pharmacy-search-table-fiscal.css';
import '../styles/pharmacy-search-table-stock.css';

/**
 * Остатки склада аптеки — колонки по ТЗ (строка в PharmacyProductSearchTableRow).
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
    visibleColumns = null,
    onEditProduct = null,
    onDeactivateProduct = null,
  },
  ref,
) {
  const { t } = useTranslation();
  const sentinelRef = useRef(null);
  const daysLabel = t('pharmacyCashier.daysShort');
  const col = (id) => !visibleColumns || visibleColumns[id] !== false;

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
          <p className="pharmacy-search__status" role="alert">{t('common.loadError')}</p>
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
            <colgroup>
              <col className="is-name" />
              {col('stock') ? <col className="is-num" /> : null}
              {col('cost') ? <col className="is-num" /> : null}
              {col('price') ? <col className="is-num" /> : null}
              {col('unitPrice') ? <col className="is-num" /> : null}
              {col('expiry') ? <col className="is-text" /> : null}
              {col('shelf') ? <col className="is-text" /> : null}
              {col('manufacturer') ? <col className="is-text" /> : null}
              {col('country') ? <col className="is-text" /> : null}
              {col('batch') ? <col className="is-text" /> : null}
              {col('score') ? <col className="is-num" /> : null}
              {col('refPrice') ? <col className="is-num" /> : null}
              {col('fiscal') ? <col className="is-fiscal" /> : null}
              {onEditProduct || onDeactivateProduct ? <col className="is-actions" /> : null}
            </colgroup>
            <thead>
              <tr>
                <th>{t('pharmacyCashier.colName')}</th>
                {col('stock') ? <th className="pharmacy-search__num">{t('pharmacyCashier.colStock')}</th> : null}
                {col('cost') ? <th className="pharmacy-search__num">{t('pharmacyCashier.colCost')}</th> : null}
                {col('price') ? <th className="pharmacy-search__num">{t('pharmacyCashier.colPrice')}</th> : null}
                {col('unitPrice') ? <th className="pharmacy-search__num">{t('pharmacyCashier.colUnitPrice')}</th> : null}
                {col('expiry') ? <th>{t('pharmacyCashier.colExpiryDays')}</th> : null}
                {col('shelf') ? <th>{t('pharmacyCashier.colShelf')}</th> : null}
                {col('manufacturer') ? <th>{t('pharmacyCashier.colManufacturer')}</th> : null}
                {col('country') ? <th>{t('pharmacyCashier.colCountry')}</th> : null}
                {col('batch') ? <th>{t('pharmacyCashier.colBatch')}</th> : null}
                {col('score') ? <th className="pharmacy-search__num">{t('pharmacyCashier.colScore')}</th> : null}
                {col('refPrice') ? <th className="pharmacy-search__num">{t('pharmacyCashier.colRefPrice')}</th> : null}
                {col('fiscal') ? <th>{t('pharmacyCashier.colIkpu')} / {t('pharmacyCashier.colMxik')}</th> : null}
                {onEditProduct || onDeactivateProduct ? <th aria-label={t('common.actions')} /> : null}
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <PharmacyProductSearchTableRow
                  key={product.id}
                  product={product}
                  storeId={storeId}
                  productsStale={productsStale}
                  t={t}
                  daysLabel={daysLabel}
                  col={col}
                  onSelectProduct={onSelectProduct}
                  onEditProduct={onEditProduct}
                  onDeactivateProduct={onDeactivateProduct}
                />
              ))}
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

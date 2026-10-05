import { forwardRef, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { fmtMoney as fmt } from '../../../utils/formatMoney';
import { formatQty } from '../../../utils/quantityFormat';
import { resolveProductUnitPrice } from '../../../utils/productPrice';
import {
  daysUntilExpiry,
  formatExpiryDisplay,
  productBatch,
  productCountry,
  productDosageForm,
  productExpiry,
  productRequiresPrescription,
  productSellByUnitHint,
  productShelfLifeDays,
} from '../utils/pharmacyProductMeta';
import {
  formatMarkedLabel,
  formatUnitsInPackCell,
  productIkpu,
  productIsMarked,
  productPackageCode,
} from '../utils/pharmacyProductFiscalMeta';
import {
  pharmacyCellToneClass,
  pharmacyExpiryTone,
  pharmacyStockTone,
} from '../utils/pharmacyCellTone';
import '../styles/pharmacy-search-table.css';
import '../styles/pharmacy-search-table-fiscal.css';
import '../styles/pharmacy-search-table-stock.css';

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
                <th>{t('pharmacyCashier.colCountry')}</th>
                <th className="pharmacy-search__num">{t('pharmacyCashier.colPrice')}</th>
                <th className="pharmacy-search__num">{t('pharmacyCashier.colStock')}</th>
                <th className="pharmacy-search__num">{t('pharmacyCashier.colPack')}</th>
                <th>{t('pharmacyCashier.colExpiryDays')}</th>
                <th>{t('pharmacyCashier.colBatch')}</th>
                <th>{t('pharmacyCashier.colMxik')}</th>
                <th>{t('pharmacyCashier.colIkpu')}</th>
                <th>{t('pharmacyCashier.colMarking')}</th>
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
                const country = productCountry(product) || '—';
                const batch = productBatch(product) || '—';
                const expiryDate = formatExpiryDisplay(productExpiry(product));
                const sellByUnit = productSellByUnitHint(product);
                const stockTone = disabled ? null : pharmacyStockTone(product);
                const expiryTone = disabled ? null : pharmacyExpiryTone(product);
                const needsRx = productRequiresPrescription(product);
                const daysLeft = daysUntilExpiry(productExpiry(product));
                const shelfLife = productShelfLifeDays(product);
                const daysLabelText = formatStockExpiryDays(daysLeft, shelfLife, daysLabel);
                const mxik = productIkpu(product) || '—';
                const ikpu = productPackageCode(product) || productIkpu(product) || '—';
                const packCode = productPackageCode(product);
                const unitsInPack = formatUnitsInPackCell(product) || '—';
                const marked = productIsMarked(product);
                const marking = formatMarkedLabel(
                  product,
                  t('pharmacyCashier.markingYes'),
                  t('pharmacyCashier.markingNo'),
                );
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
                    <td className="pharmacy-search__mono pharmacy-search__clip" title={country}>
                      <span className="pharmacy-search__cell-text">{country}</span>
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
                    <td className="pharmacy-search__num pharmacy-search__mono" title={unitsInPack}>
                      <span className="pharmacy-search__cell-text">{unitsInPack}</span>
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
                    <td
                      className="pharmacy-search__mono pharmacy-search__clip pharmacy-search__fiscal"
                      title={packCode ? `${mxik} · ${t('pharmacyCashier.colPackageCode')}: ${packCode}` : mxik}
                    >
                      <span className="pharmacy-search__cell-text">{mxik}</span>
                    </td>
                    <td className="pharmacy-search__mono pharmacy-search__clip pharmacy-search__fiscal" title={ikpu}>
                      <span className="pharmacy-search__cell-text">{ikpu}</span>
                    </td>
                    <td className="pharmacy-search__mono pharmacy-search__marking">
                      <span
                        className={[
                          'pharmacy-search__mark-badge',
                          marked ? 'is-yes' : 'is-no',
                        ].join(' ')}
                      >
                        {marking}
                      </span>
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

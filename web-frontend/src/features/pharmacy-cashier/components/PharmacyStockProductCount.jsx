import './pharmacy-stock-count.css';

/** Счётчик товаров в шапке остатков кассы. */
export default function PharmacyStockProductCount({ t, count }) {
  const n = Number(count);
  if (!Number.isFinite(n) || n < 0) return null;
  return (
    <span className="pharmacy-stock-count" title={t('pharmacyCashier.productsTotalTitle', { count: n })}>
      <span className="pharmacy-stock-count__label">{t('pharmacyCashier.productsTotalLabel')}</span>
      <span className="pharmacy-stock-count__value">{n}</span>
    </span>
  );
}

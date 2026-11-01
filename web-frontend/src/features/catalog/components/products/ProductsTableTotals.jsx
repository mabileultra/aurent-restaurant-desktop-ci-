import { useTranslation } from 'react-i18next';
import { fmtMoney } from '../../../../utils/formatMoney';

/** Inline totals for products table pagination (filtered set). */
export default function ProductsTableTotals({ productCount, stockValueTotal }) {
  const { t } = useTranslation();
  const count = Number(productCount) || 0;
  const sum = stockValueTotal == null ? null : Number(stockValueTotal);

  return (
    <>
      <span>{t('products.paginationTotal', { count })}</span>
      <span className="table-pagination__summary-sep" aria-hidden="true">·</span>
      <span>{t('products.paginationSum', { sum: fmtMoney(sum ?? 0) })}</span>
    </>
  );
}

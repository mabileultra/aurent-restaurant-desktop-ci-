import { formatQty } from '../../../../utils/quantityFormat';

export default function StockInventoryVarianceBadge({ t, variance, product }) {
  if (!variance || variance.status === 'empty') {
    return <span className="stock-inv-var stock-inv-var--empty">—</span>;
  }
  const qty = formatQty(Math.abs(variance.delta), product?.saleType, product?.unitCode);
  if (variance.status === 'match') {
    return <span className="stock-inv-var stock-inv-var--match">{t('stockReports.inventoryVarianceMatch', { qty })}</span>;
  }
  if (variance.status === 'shortage') {
    return <span className="stock-inv-var stock-inv-var--shortage">{t('stockReports.inventoryVarianceShortage', { qty })}</span>;
  }
  return <span className="stock-inv-var stock-inv-var--surplus">{t('stockReports.inventoryVarianceSurplus', { qty })}</span>;
}

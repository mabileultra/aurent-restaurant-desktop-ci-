import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { fmtMoney as fmt } from '../../../utils/formatMoney';
import PharmacyCartTableRow from './PharmacyCartTableRow';
import '../styles/pharmacy-cart-table.css';
import '../styles/pharmacy-cart-table-columns.css';

/**
 * Чек аптеки — колонки по ТЗ (строка вынесена в PharmacyCartTableRow).
 */
export default function PharmacyCartTable({
  items,
  selectedLineId,
  onSelectLine,
  onQtyDelta,
  onRemove,
  onUpdatePrice,
  total = 0,
}) {
  const { t } = useTranslation();
  const [editingPriceLineId, setEditingPriceLineId] = useState(null);
  const [priceDraft, setPriceDraft] = useState('');

  const commitPrice = (lineId) => {
    onUpdatePrice?.(lineId, priceDraft);
    setEditingPriceLineId(null);
  };

  if (!items.length) {
    return (
      <div className="pharmacy-cart-table">
        <p className="pharmacy-cart-table__empty">{t('pharmacyCashier.cartEmpty')}</p>
      </div>
    );
  }

  return (
    <div className="pharmacy-cart-table">
      <div className="pharmacy-cart-table__scroll">
        <table className="pharmacy-cart-table__table pharmacy-cart-table__table--receipt">
          <thead>
            <tr>
              <th className="pharmacy-cart-table__num">№</th>
              <th className="pharmacy-cart-table__num" title={t('pharmacyCashier.colSelect')}>✓</th>
              <th>{t('pharmacyCashier.colMarking')}</th>
              <th>{t('pharmacyCashier.colMarkStatus')}</th>
              <th className="pharmacy-cart-table__name">{t('pharmacyCashier.colName')}</th>
              <th className="pharmacy-cart-table__num">{t('pharmacyCashier.colPrice')}</th>
              <th className="pharmacy-cart-table__num">{t('pharmacyCashier.colQty')}</th>
              <th>{t('pharmacyCashier.colExpiryShort')}</th>
              <th className="pharmacy-cart-table__num">{t('pharmacyCashier.colSumRetail')}</th>
              <th className="pharmacy-cart-table__num">{t('pharmacyCashier.colDiscount')}</th>
              <th className="pharmacy-cart-table__num">{t('pharmacyCashier.colSumNet')}</th>
              <th className="pharmacy-cart-table__num">{t('pharmacyCashier.colVat')}</th>
              <th>{t('pharmacyCashier.colManufacturer')}</th>
              <th aria-label={t('common.actions')} />
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <PharmacyCartTableRow
                key={item.lineId}
                item={item}
                index={index}
                selected={selectedLineId === item.lineId}
                t={t}
                onSelectLine={onSelectLine}
                onQtyDelta={onQtyDelta}
                onRemove={onRemove}
                onUpdatePrice={onUpdatePrice}
                editingPrice={Boolean(onUpdatePrice) && editingPriceLineId === item.lineId}
                priceDraft={priceDraft}
                setPriceDraft={setPriceDraft}
                setEditingPriceLineId={setEditingPriceLineId}
                commitPrice={commitPrice}
              />
            ))}
          </tbody>
        </table>
      </div>
      <div className="pharmacy-cart-table__foot">
        <span>{t('pharmacyCashier.receiptItems', { count: items.length })}</span>
        <strong>{fmt(total)}</strong>
      </div>
    </div>
  );
}

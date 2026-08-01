import { Minus, Plus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { lineSubtotal } from '../../../store/cartStore';
import { fmtMoney as fmt } from '../../../utils/formatMoney';
import { formatQty } from '../../../utils/quantityFormat';
import {
  formatExpiryRemaining,
  productBatch,
  productDosageForm,
  productStorageLocation,
  productUnitLabel,
} from '../utils/pharmacyProductMeta';
import {
  pharmacyCellToneClass,
  pharmacyExpiryTone,
  pharmacyShelfTone,
  pharmacyStockTone,
} from '../utils/pharmacyCellTone';
import '../styles/pharmacy-cart-table.css';

export default function PharmacyCartTable({
  items,
  selectedLineId,
  onSelectLine,
  onQtyDelta,
  onRemove,
}) {
  const { t } = useTranslation();
  const daysLabel = t('pharmacyCashier.daysShort');

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
        <table className="pharmacy-cart-table__table">
          <thead>
            <tr>
              <th>{t('pharmacyCashier.colName')}</th>
              <th>{t('pharmacyCashier.colUnit')}</th>
              <th>{t('pharmacyCashier.colForm')}</th>
              <th>{t('pharmacyCashier.colShelf')}</th>
              <th className="pharmacy-cart-table__num">{t('pharmacyCashier.colQty')}</th>
              <th className="pharmacy-cart-table__num">{t('pharmacyCashier.colPrice')}</th>
              <th className="pharmacy-cart-table__num">{t('pharmacyCashier.colSum')}</th>
              <th>{t('pharmacyCashier.colExpiry')}</th>
              <th>{t('pharmacyCashier.colBatch')}</th>
              <th className="pharmacy-cart-table__num">{t('pharmacyCashier.colStock')}</th>
              <th>{t('pharmacyCashier.colIkpu')}</th>
              <th aria-label={t('common.actions')} />
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const unit = productUnitLabel(item) || '—';
              const form = productDosageForm(item) || '—';
              const shelf = productStorageLocation(item) || '—';
              const expiry = formatExpiryRemaining(item, daysLabel) || '—';
              const batch = productBatch(item) || '—';
              const stockTone = pharmacyStockTone(item, { stockKey: 'maxStock' });
              const expiryTone = pharmacyExpiryTone(item);
              const shelfTone = pharmacyShelfTone(item);
              return (
                <tr
                  key={item.lineId}
                  className={[
                    'pharmacy-cart-table__row',
                    selectedLineId === item.lineId ? 'is-selected' : '',
                  ].filter(Boolean).join(' ')}
                  onClick={() => onSelectLine(item.lineId)}
                >
                  <td className="pharmacy-cart-table__name">{item.name}</td>
                  <td className="pharmacy-cart-table__mono">{unit}</td>
                  <td className="pharmacy-cart-table__mono">{form}</td>
                  <td
                    className={[
                      'pharmacy-cart-table__mono',
                      pharmacyCellToneClass(shelfTone, 'pharmacy-cart-table__cell'),
                    ].filter(Boolean).join(' ')}
                  >
                    {shelf}
                  </td>
                  <td className="pharmacy-cart-table__num">
                    {formatQty(item.quantity, item.saleType, item.unitCode)}
                  </td>
                  <td className="pharmacy-cart-table__num">{fmt(item.unitPrice)}</td>
                  <td className="pharmacy-cart-table__num">{fmt(lineSubtotal(item))}</td>
                  <td
                    className={[
                      'pharmacy-cart-table__mono',
                      pharmacyCellToneClass(expiryTone, 'pharmacy-cart-table__cell'),
                    ].filter(Boolean).join(' ')}
                  >
                    {expiry}
                  </td>
                  <td className="pharmacy-cart-table__mono">{batch}</td>
                  <td
                    className={[
                      'pharmacy-cart-table__num',
                      pharmacyCellToneClass(stockTone, 'pharmacy-cart-table__cell'),
                    ].filter(Boolean).join(' ')}
                  >
                    {formatQty(item.maxStock, item.saleType, item.unitCode)}
                  </td>
                  <td className="pharmacy-cart-table__mono">{item.ikpu || '—'}</td>
                  <td>
                    <div className="pharmacy-cart-table__actions">
                      <button
                        type="button"
                        className="pharmacy-cart-table__qty-btn"
                        aria-label="−"
                        onClick={(e) => {
                          e.stopPropagation();
                          onQtyDelta(item.lineId, -1);
                        }}
                      >
                        <Minus size={12} strokeWidth={2.5} aria-hidden />
                      </button>
                      <button
                        type="button"
                        className="pharmacy-cart-table__qty-btn"
                        aria-label="+"
                        onClick={(e) => {
                          e.stopPropagation();
                          onQtyDelta(item.lineId, 1);
                        }}
                      >
                        <Plus size={12} strokeWidth={2.5} aria-hidden />
                      </button>
                      <button
                        type="button"
                        className="pharmacy-cart-table__remove"
                        aria-label={t('common.delete')}
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemove(item.lineId);
                        }}
                      >
                        <Trash2 size={12} strokeWidth={2.25} aria-hidden />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

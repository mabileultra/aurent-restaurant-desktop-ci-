import { Minus, Plus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { lineSubtotal } from '../../../store/cartStore';
import { fmtMoney as fmt } from '../../../utils/formatMoney';
import { formatQty } from '../../../utils/quantityFormat';
import {
  formatExpiryRemaining,
  productBatch,
  productCountry,
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
import '../styles/pharmacy-cart-table-columns.css';

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
          <colgroup>
            <col className="pharmacy-col pharmacy-col--name" />
            <col className="pharmacy-col pharmacy-col--unit" />
            <col className="pharmacy-col pharmacy-col--form" />
            <col className="pharmacy-col pharmacy-col--country" />
            <col className="pharmacy-col pharmacy-col--shelf" />
            <col className="pharmacy-col pharmacy-col--qty" />
            <col className="pharmacy-col pharmacy-col--money" />
            <col className="pharmacy-col pharmacy-col--money" />
            <col className="pharmacy-col pharmacy-col--expiry" />
            <col className="pharmacy-col pharmacy-col--batch" />
            <col className="pharmacy-col pharmacy-col--stock" />
            <col className="pharmacy-col pharmacy-col--ikpu" />
            <col className="pharmacy-col pharmacy-col--actions" />
          </colgroup>
          <thead>
            <tr>
              <th>{t('pharmacyCashier.colName')}</th>
              <th>{t('pharmacyCashier.colUnit')}</th>
              <th>{t('pharmacyCashier.colForm')}</th>
              <th>{t('pharmacyCashier.colCountry')}</th>
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
              const country = productCountry(item) || '—';
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
                  <td className="pharmacy-cart-table__name" title={item.name}>
                    <span className="pharmacy-cart-table__cell-text pharmacy-cart-table__cell-text--name">
                      {item.name}
                    </span>
                  </td>
                  <td className="pharmacy-cart-table__mono pharmacy-cart-table__clip" title={unit}>
                    <span className="pharmacy-cart-table__cell-text">{unit}</span>
                  </td>
                  <td className="pharmacy-cart-table__mono pharmacy-cart-table__clip" title={form}>
                    <span className="pharmacy-cart-table__cell-text">{form}</span>
                  </td>
                  <td className="pharmacy-cart-table__mono pharmacy-cart-table__clip" title={country}>
                    <span className="pharmacy-cart-table__cell-text">{country}</span>
                  </td>
                  <td
                    className={[
                      'pharmacy-cart-table__mono',
                      pharmacyCellToneClass(shelfTone, 'pharmacy-cart-table__cell'),
                    ].filter(Boolean).join(' ')}
                  >
                    {shelf}
                  </td>
                  <td className="pharmacy-cart-table__num">
                    {item.pharmacySellByPiece ? (
                      <span
                        className="pharmacy-cart-table__piece-qty"
                        title={t('pharmacyCashier.packOf', { count: item.unitsInPack })}
                      >
                        <span className="pharmacy-cart-table__piece-qty-main">
                          {t('pharmacyCashier.pieceCount', { count: Math.round(item.quantity) })}
                        </span>
                        {item.unitsInPack > 1 ? (
                          <span className="pharmacy-cart-table__piece-qty-pack">
                            {t('pharmacyCashier.packOf', { count: item.unitsInPack })}
                          </span>
                        ) : null}
                      </span>
                    ) : (
                      <span className="pharmacy-cart-table__money">
                        {formatQty(item.quantity, item.saleType, item.unitCode)}
                      </span>
                    )}
                  </td>
                  <td className="pharmacy-cart-table__num">
                    <span className="pharmacy-cart-table__money">{fmt(item.unitPrice)}</span>
                    {item.pharmacySellByPiece ? (
                      <span className="pharmacy-cart-table__piece-price-hint">
                        {t('pharmacyCashier.perPieceShort')}
                      </span>
                    ) : null}
                  </td>
                  <td className="pharmacy-cart-table__num">
                    <span className="pharmacy-cart-table__money">{fmt(lineSubtotal(item))}</span>
                  </td>
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
                    <span className="pharmacy-cart-table__money">
                      {item.pharmacySellByPiece
                        ? t('pharmacyCashier.pieceCount', { count: Math.floor(item.maxStock) })
                        : formatQty(item.maxStock, item.saleType, item.unitCode)}
                    </span>
                  </td>
                  <td className="pharmacy-cart-table__mono pharmacy-cart-table__ikpu" title={item.ikpu || undefined}>
                    <span className="pharmacy-cart-table__cell-text">{item.ikpu || '—'}</span>
                  </td>
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
                        <Minus size={18} strokeWidth={2.5} aria-hidden />
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
                        <Plus size={18} strokeWidth={2.5} aria-hidden />
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
                        <Trash2 size={16} strokeWidth={2.25} aria-hidden />
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

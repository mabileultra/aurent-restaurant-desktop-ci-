import { useState } from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { lineDiscountAmount, lineSubtotal } from '../../../store/cartStore';
import { fmtMoney as fmt } from '../../../utils/formatMoney';
import { formatQty } from '../../../utils/quantityFormat';
import { formatCartPackPieceQty } from '../utils/pharmacyPackQty';
import { isMarkCountedLine } from '../../marking';
import {
  pharmacyCartDisplayPrice,
} from '../utils/pharmacyCartActions';
import {
  formatExpiryDisplay,
  productBatch,
  productDosageForm,
  productRequiresPrescription,
  productExpiry,
} from '../utils/pharmacyProductMeta';
import '../styles/pharmacy-cart-table.css';
import '../styles/pharmacy-cart-table-columns.css';

/**
 * Чек аптеки — колонки как в макете (только pharmacy-cashier).
 */
export default function PharmacyCartTable({
  items,
  selectedLineId,
  onSelectLine,
  onQtyDelta,
  onRemove,
  onUpdatePrice,
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
          <colgroup>
            <col className="pharmacy-col pharmacy-col--idx" />
            <col className="pharmacy-col pharmacy-col--name" />
            <col className="pharmacy-col pharmacy-col--form" />
            <col className="pharmacy-col pharmacy-col--money" />
            <col className="pharmacy-col pharmacy-col--qty-ctrl" />
            <col className="pharmacy-col pharmacy-col--money" />
            <col className="pharmacy-col pharmacy-col--money" />
            <col className="pharmacy-col pharmacy-col--actions" />
          </colgroup>
          <thead>
            <tr>
              <th className="pharmacy-cart-table__num">#</th>
              <th>{t('pharmacyCashier.colName')}</th>
              <th>{t('pharmacyCashier.colForm')}</th>
              <th className="pharmacy-cart-table__num">{t('pharmacyCashier.colPrice')}</th>
              <th className="pharmacy-cart-table__num">{t('pharmacyCashier.colQty')}</th>
              <th className="pharmacy-cart-table__num">{t('pharmacyCashier.colDiscount')}</th>
              <th className="pharmacy-cart-table__num">{t('pharmacyCashier.colSum')}</th>
              <th aria-label={t('common.actions')} />
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => {
              const form = productDosageForm(item) || '—';
              const batch = productBatch(item);
              const expiry = formatExpiryDisplay(productExpiry(item));
              const needsRx = productRequiresPrescription(item);
              const marksCounted = isMarkCountedLine(item);
              const discount = lineDiscountAmount(item);
              const displayPrice = pharmacyCartDisplayPrice(item);
              const meta = [batch ? `${t('pharmacyCashier.colBatch')}: ${batch}` : '', expiry ? `${t('pharmacyCashier.colExpiryShort')}: ${expiry}` : '']
                .filter(Boolean)
                .join(' · ');
              const editingPrice = Boolean(onUpdatePrice) && editingPriceLineId === item.lineId;

              return (
                <tr
                  key={item.lineId}
                  className={[
                    'pharmacy-cart-table__row',
                    selectedLineId === item.lineId ? 'is-selected' : '',
                    needsRx ? 'is-recipe' : '',
                  ].filter(Boolean).join(' ')}
                  onClick={() => onSelectLine(item.lineId)}
                >
                  <td className="pharmacy-cart-table__num pharmacy-cart-table__idx">
                    {index + 1}
                  </td>
                  <td className="pharmacy-cart-table__name" title={item.name}>
                    <div className="pharmacy-cart-table__name-block">
                      <span className="pharmacy-cart-table__cell-text pharmacy-cart-table__cell-text--name">
                        {item.name}
                      </span>
                      {needsRx ? (
                        <span className="pharmacy-cart-table__recipe-tag">
                          {t('pharmacyCashier.recipeTag')}
                        </span>
                      ) : null}
                      {meta ? (
                        <span className="pharmacy-cart-table__name-meta">{meta}</span>
                      ) : null}
                    </div>
                  </td>
                  <td className="pharmacy-cart-table__mono pharmacy-cart-table__clip" title={form}>
                    <span className="pharmacy-cart-table__cell-text">{form}</span>
                  </td>
                  <td className="pharmacy-cart-table__num" onClick={(e) => e.stopPropagation()}>
                    {editingPrice ? (
                      <input
                        type="text"
                        inputMode="decimal"
                        className="pharmacy-cart-table__price-input"
                        value={priceDraft}
                        onChange={(e) => setPriceDraft(e.target.value)}
                        onBlur={() => commitPrice(item.lineId)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') commitPrice(item.lineId);
                          if (e.key === 'Escape') setEditingPriceLineId(null);
                        }}
                        autoFocus
                        aria-label={t('pharmacyCashier.colPrice')}
                      />
                    ) : onUpdatePrice ? (
                      <button
                        type="button"
                        className="pharmacy-cart-table__price-btn"
                        onClick={() => {
                          setEditingPriceLineId(item.lineId);
                          setPriceDraft(String(displayPrice));
                        }}
                        title={t('pharmacyCashier.priceEditHint')}
                      >
                        <span className="pharmacy-cart-table__money">{fmt(displayPrice)}</span>
                        {item.pharmacySellByPiece && Number(item.unitsInPack) > 1 ? (
                          <span className="pharmacy-cart-table__piece-price-hint">
                            {t('pharmacyCashier.perPackShort')}
                          </span>
                        ) : null}
                      </button>
                    ) : (
                      <>
                        <span className="pharmacy-cart-table__money">{fmt(displayPrice)}</span>
                        {item.pharmacySellByPiece && Number(item.unitsInPack) > 1 ? (
                          <span className="pharmacy-cart-table__piece-price-hint">
                            {t('pharmacyCashier.perPackShort')}
                          </span>
                        ) : null}
                      </>
                    )}
                  </td>
                  <td className="pharmacy-cart-table__num" onClick={(e) => e.stopPropagation()}>
                    <div className="pharmacy-cart-table__qty-ctrl">
                      <button
                        type="button"
                        className="pharmacy-cart-table__qty-btn"
                        aria-label="−"
                        disabled={marksCounted}
                        onClick={() => onQtyDelta(item.lineId, -1)}
                      >
                        <Minus size={12} strokeWidth={2.5} aria-hidden />
                      </button>
                      <span className="pharmacy-cart-table__qty-val">
                        {item.pharmacySellByPiece && Number(item.unitsInPack) > 1
                          ? formatCartPackPieceQty(
                            item.quantity,
                            item.unitsInPack,
                            true,
                            { pack: t('pharmacyCashier.packUnit'), piece: t('pharmacyCashier.pieceUnit') },
                          )
                          : formatQty(item.quantity, item.saleType, item.unitCode)}
                      </span>
                      <button
                        type="button"
                        className="pharmacy-cart-table__qty-btn"
                        aria-label="+"
                        disabled={marksCounted}
                        onClick={() => onQtyDelta(item.lineId, 1)}
                      >
                        <Plus size={12} strokeWidth={2.5} aria-hidden />
                      </button>
                    </div>
                  </td>
                  <td className="pharmacy-cart-table__num">
                    <span className="pharmacy-cart-table__money">
                      {discount > 0 ? fmt(discount) : '—'}
                    </span>
                  </td>
                  <td className="pharmacy-cart-table__num">
                    <span className="pharmacy-cart-table__money">{fmt(lineSubtotal(item))}</span>
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      className="pharmacy-cart-table__remove"
                      aria-label={t('common.delete')}
                      onClick={() => onRemove(item.lineId)}
                    >
                      <Trash2 size={13} strokeWidth={2.25} aria-hidden />
                    </button>
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

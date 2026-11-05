import { Minus, Plus, Trash2 } from 'lucide-react';
import { lineDiscountAmount, lineSubtotal } from '../../../store/cartStore';
import { extractVatFromInclusive } from '../../../utils/taxAmounts';
import { fmtMoney as fmt } from '../../../utils/formatMoney';
import { formatQty } from '../../../utils/quantityFormat';
import { formatCartPackPieceQty } from '../utils/pharmacyPackQty';
import { isMarkCountedLine } from '../../marking';
import { pharmacyCartDisplayPrice } from '../utils/pharmacyCartActions';
import {
  formatExpiryDisplay,
  productExpiry,
  productManufacturer,
  productRequiresPrescription,
} from '../utils/pharmacyProductMeta';

function lineMarkCode(item) {
  if (item.markCode) return String(item.markCode);
  if (item.productMark) return String(item.productMark);
  if (Array.isArray(item.productMarks) && item.productMarks[0]) {
    return String(item.productMarks[0]);
  }
  return '';
}

function markStatusLabel(item, t) {
  if (isMarkCountedLine(item)) return t('pharmacyCashier.markStatusOk');
  if (item.marked || item.requiresMarking) return t('pharmacyCashier.markStatusNeed');
  return t('pharmacyCashier.markStatusNone');
}

/**
 * Строка чека аптеки — колонки по ТЗ (без логики таблицы).
 */
export default function PharmacyCartTableRow({
  item,
  index,
  selected,
  t,
  onSelectLine,
  onQtyDelta,
  onRemove,
  onUpdatePrice,
  editingPrice,
  priceDraft,
  setPriceDraft,
  setEditingPriceLineId,
  commitPrice,
}) {
  const marksCounted = isMarkCountedLine(item);
  const discount = lineDiscountAmount(item);
  const net = lineSubtotal(item);
  const gross = net + discount;
  const displayPrice = pharmacyCartDisplayPrice(item);
  const expiry = formatExpiryDisplay(productExpiry(item)) || '—';
  const manufacturer = productManufacturer(item) || '—';
  const markCode = lineMarkCode(item);
  const markShort = markCode ? `${markCode.slice(0, 10)}…` : '—';
  const vat = extractVatFromInclusive(net, item.taxRate);

  return (
    <tr
      className={[
        'pharmacy-cart-table__row',
        selected ? 'is-selected' : '',
        productRequiresPrescription(item) ? 'is-recipe' : '',
      ].filter(Boolean).join(' ')}
      onClick={() => onSelectLine(item.lineId)}
    >
      <td className="pharmacy-cart-table__num pharmacy-cart-table__idx">{index + 1}</td>
      <td className="pharmacy-cart-table__num" onClick={(e) => e.stopPropagation()}>
        <input
          type="checkbox"
          className="pharmacy-cart-table__select"
          checked={selected}
          onChange={() => onSelectLine(selected ? null : item.lineId)}
          aria-label={t('pharmacyCashier.colSelect')}
        />
      </td>
      <td className="pharmacy-cart-table__mono" title={markCode || undefined}>
        <span className="pharmacy-cart-table__cell-text">{markShort}</span>
      </td>
      <td>
        <span className={`pharmacy-cart-table__mark-status${marksCounted ? ' is-ok' : ''}`}>
          {markStatusLabel(item, t)}
        </span>
      </td>
      <td className="pharmacy-cart-table__name" title={item.name}>
        <span className="pharmacy-cart-table__cell-text pharmacy-cart-table__cell-text--name">
          {item.name}
        </span>
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
          </button>
        ) : (
          <span className="pharmacy-cart-table__money">{fmt(displayPrice)}</span>
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
              ? formatCartPackPieceQty(item.quantity, item.unitsInPack, true, {
                pack: t('pharmacyCashier.packUnit'),
                piece: t('pharmacyCashier.pieceUnit'),
              })
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
      <td className="pharmacy-cart-table__mono">
        <span className="pharmacy-cart-table__cell-text">{expiry}</span>
      </td>
      <td className="pharmacy-cart-table__num">
        <span className="pharmacy-cart-table__money">{fmt(gross)}</span>
      </td>
      <td className="pharmacy-cart-table__num">
        <span className="pharmacy-cart-table__money">{discount > 0 ? fmt(discount) : '—'}</span>
      </td>
      <td className="pharmacy-cart-table__num">
        <span className="pharmacy-cart-table__money">{fmt(net)}</span>
      </td>
      <td className="pharmacy-cart-table__num">
        <span className="pharmacy-cart-table__money">{fmt(vat)}</span>
      </td>
      <td className="pharmacy-cart-table__mono" title={manufacturer}>
        <span className="pharmacy-cart-table__cell-text">{manufacturer}</span>
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
}

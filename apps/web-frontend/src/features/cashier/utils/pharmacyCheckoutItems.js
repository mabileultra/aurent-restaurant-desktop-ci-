import { lineDiscountAmount, buildCheckoutLineItems } from '../../../store/cartStore';
import { round2 } from '../../../utils/taxAmounts';
import { roundQty } from '../../../utils/quantityFormat';
import { isMarkCountedLine } from '../../marking';
import { pharmacyCheckoutLineFromCartItem } from './pharmacyPackSale';

function lineMarks(item) {
  if (Array.isArray(item?.productMarks) && item.productMarks.length > 0) {
    return item.productMarks.filter(Boolean);
  }
  const single = item?.productMark || item?.markCode;
  return single ? [single] : [];
}

export function buildPharmacyCheckoutLineItems(items) {
  return items.map((item) => {
    const marks = lineMarks(item);
    // Только строки с КМ: qty = число марок (упаковок). Флаг markedProduct без КМ
    // не отменяет поштучный пересчёт — иначе 112 шт уходит как 112 уп.
    if (isMarkCountedLine(item) || marks.length > 0) {
      return {
        productId: item.productId,
        quantity: roundQty(marks.length > 0 ? marks.length : item.quantity),
        discount: lineDiscountAmount(item),
        unitPrice: round2(item.unitPrice),
        productMarks: marks,
      };
    }

    const packLine = pharmacyCheckoutLineFromCartItem(item);
    if (packLine) {
      return {
        productId: item.productId,
        quantity: roundQty(packLine.quantity),
        discount: lineDiscountAmount(item),
        unitPrice: packLine.unitPrice,
      };
    }

    return {
      productId: item.productId,
      quantity: roundQty(item.quantity),
      discount: lineDiscountAmount(item),
      unitPrice: round2(item.unitPrice),
    };
  });
}

function needsPharmacyPackCheckout(items) {
  return items.some(
    (line) => line.pharmacySellByPiece === true
      || line.packUnitPrice != null
      || isMarkCountedLine(line)
      || lineMarks(line).length > 0,
  );
}

export function resolveCheckoutLineItems(items) {
  if (needsPharmacyPackCheckout(items)) {
    return buildPharmacyCheckoutLineItems(items);
  }
  return buildCheckoutLineItems(items);
}

import { lineDiscountAmount, buildCheckoutLineItems } from '../../../store/cartStore';
import { round2 } from '../../../utils/taxAmounts';
import { roundQty } from '../../../utils/quantityFormat';
import { isMarkCountedLine } from './pharmacyMarkedScanCart';
import { pharmacyCheckoutLineFromCartItem } from './pharmacyPackSale';

export function buildPharmacyCheckoutLineItems(items) {
  return items.map((item) => {
    // Маркировка: qty = число КМ (упаковок), без пересчёта в штуки.
    if (isMarkCountedLine(item) || item?.markedProduct === true) {
      return {
        productId: item.productId,
        quantity: roundQty(item.quantity),
        discount: lineDiscountAmount(item),
        unitPrice: round2(item.unitPrice),
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
    (line) => line.pharmacySellByPiece === true || line.packUnitPrice != null,
  );
}

export function resolveCheckoutLineItems(items) {
  if (needsPharmacyPackCheckout(items)) {
    return buildPharmacyCheckoutLineItems(items);
  }
  return buildCheckoutLineItems(items);
}

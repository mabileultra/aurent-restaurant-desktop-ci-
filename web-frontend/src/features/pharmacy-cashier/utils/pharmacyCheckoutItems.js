import { lineDiscountAmount } from '../../../store/cartStore';
import { buildCheckoutLineItems } from '../../../store/cartStore';
import { round2 } from '../../../utils/taxAmounts';
import { roundQty } from '../../../utils/quantityFormat';
import { pharmacyCheckoutLineFromCartItem } from './pharmacyPackSale';

export function buildPharmacyCheckoutLineItems(items) {
  return items.map((item) => {
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

export function resolveCheckoutLineItems(items) {
  if (items.some((line) => line.pharmacySellByPiece)) {
    return buildPharmacyCheckoutLineItems(items);
  }
  return buildCheckoutLineItems(items);
}

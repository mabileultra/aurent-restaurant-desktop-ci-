import { lineDiscountAmount } from '../../../store/cartStore';
import { buildCheckoutLineItems } from '../../../store/cartStore';
import { round2 } from '../../../utils/taxAmounts';
import { roundQty } from '../../../utils/quantityFormat';
import { productUnitsInPack } from './pharmacyProductMeta';
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

function needsPharmacyPackCheckout(items) {
  return items.some((line) => {
    if (line.pharmacySellByPiece) return true;
    const units = line.unitsInPack || productUnitsInPack(line);
    return units != null && units > 1;
  });
}

export function resolveCheckoutLineItems(items) {
  if (needsPharmacyPackCheckout(items)) {
    return buildPharmacyCheckoutLineItems(items);
  }
  return buildCheckoutLineItems(items);
}

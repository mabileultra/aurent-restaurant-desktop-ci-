import { useCallback } from 'react';
import { useCartStore } from '../../../store/cartStore';
import { resolveCheckoutLineItems } from '../utils/pharmacyCheckoutItems';
import { applyPharmacyPackSaleToCartProduct } from './pharmacyPackSale';

/** Добавить штучную позицию с учётом продажи из упаковки. */
export function addPharmacyPieceItem(product, quantity = 1) {
  // payload из qty-modal уже прогнан через applyPharmacyPackSaleToCartProduct —
  // повторно не конвертируем (иначе 22000/30/30 = 24.44).
  const payload =
    product?.pharmacySellByPiece === true && product?.packUnitPrice != null
      ? product
      : applyPharmacyPackSaleToCartProduct(product);
  return useCartStore.getState().addPieceItem(payload, quantity);
}

export function usePharmacyCheckoutLineItems() {
  return useCallback(() => resolveCheckoutLineItems(useCartStore.getState().items), []);
}

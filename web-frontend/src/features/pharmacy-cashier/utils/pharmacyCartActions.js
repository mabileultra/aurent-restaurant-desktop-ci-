import { useCallback } from 'react';
import { useCartStore } from '../../../store/cartStore';
import { resolveCheckoutLineItems } from '../utils/pharmacyCheckoutItems';
import { applyPharmacyPackSaleToCartProduct } from './pharmacyPackSale';

/** Добавить штучную позицию с учётом продажи из упаковки. */
export function addPharmacyPieceItem(product, quantity = 1) {
  const payload = applyPharmacyPackSaleToCartProduct(product);
  return useCartStore.getState().addPieceItem(payload, quantity);
}

export function usePharmacyCheckoutLineItems() {
  return useCallback(() => resolveCheckoutLineItems(useCartStore.getState().items), []);
}

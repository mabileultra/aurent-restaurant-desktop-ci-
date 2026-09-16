import { useCallback } from 'react';
import { useCartStore } from '../../../store/cartStore';
import { resolveCheckoutLineItems } from '../utils/pharmacyCheckoutItems';
import { applyPharmacyPackSaleToCartProduct } from './pharmacyPackSale';

/** Добавить позицию: поштучно (qty в штуках) или целыми упаковками. */
export function addPharmacyPieceItem(product, quantity = 1) {
  const payload = product?.pharmacySellByPiece === false
    ? { ...product, pharmacySellByPiece: false, packUnitPrice: product.packUnitPrice ?? null }
    : product?.pharmacySellByPiece === true && product?.packUnitPrice != null
      ? product
      : applyPharmacyPackSaleToCartProduct(product);
  return useCartStore.getState().addPieceItem(payload, quantity);
}

export function usePharmacyCheckoutLineItems() {
  return useCallback(() => resolveCheckoutLineItems(useCartStore.getState().items), []);
}

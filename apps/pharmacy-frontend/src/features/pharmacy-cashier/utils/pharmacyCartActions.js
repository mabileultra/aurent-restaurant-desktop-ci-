import { useCallback } from 'react';
import { useCartStore } from '../../../store/cartStore';
import { round2 } from '../../../utils/taxAmounts';
import { resolveCheckoutLineItems } from '../utils/pharmacyCheckoutItems';
import {
  applyPharmacyPackSaleToCartProduct,
  pharmacyPieceUnitPrice,
} from './pharmacyPackSale';

/** Добавить позицию: поштучно (qty в штуках) или целыми упаковками. */
export function addPharmacyPieceItem(product, quantity = 1) {
  const payload = product?.pharmacySellByPiece === false
    ? { ...product, pharmacySellByPiece: false, packUnitPrice: product.packUnitPrice ?? null }
    : product?.pharmacySellByPiece === true && product?.packUnitPrice != null
      ? product
      : applyPharmacyPackSaleToCartProduct(product);
  return useCartStore.getState().addPieceItem(payload, quantity);
}

/** Цена в чеке: для поштучной продажи правим цену упаковки и пересчитываем цену штуки. */
export function updatePharmacyCartLinePrice(lineId, rawPrice) {
  const num = Number(String(rawPrice ?? '').replace(',', '.').replace(/\s/g, ''));
  if (!Number.isFinite(num)) return;
  const price = Math.max(0, round2(num));
  const store = useCartStore.getState();
  const item = store.items.find((row) => row.lineId === lineId);
  if (!item) return;

  const units = Number(item.unitsInPack);
  const packMode = item.pharmacySellByPiece === true && units > 1;

  if (packMode) {
    store.patchLine(lineId, {
      packUnitPrice: price,
      unitPrice: pharmacyPieceUnitPrice(price, units),
    });
    return;
  }

  store.updateUnitPrice(lineId, price);
}

export function pharmacyCartDisplayPrice(item) {
  if (!item) return 0;
  if (item.pharmacySellByPiece === true && Number(item.unitsInPack) > 1 && item.packUnitPrice != null) {
    return Number(item.packUnitPrice);
  }
  return Number(item.unitPrice);
}

export function usePharmacyCheckoutLineItems() {
  return useCallback(() => resolveCheckoutLineItems(useCartStore.getState().items), []);
}

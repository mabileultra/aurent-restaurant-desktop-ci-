import { isPieceLikeProduct, roundQty } from '../utils/quantityFormat';
import { round2 } from '../utils/taxAmounts';
import {
  buildLine,
  capOrderDiscount,
  syncDiscountFromPercent,
} from './cartCalculations';

export function addPieceItemToCart(items, product, quantity = 1, currentOrderDiscount = 0) {
  const qty = roundQty(quantity);
  const existing = items.find(
    (i) =>
      i.productId === product.id
      && isPieceLikeProduct(i)
      && Boolean(i.pharmacySellByPiece) === Boolean(product.pharmacySellByPiece)
      && !(Array.isArray(i.productMarks) && i.productMarks.length > 0)
  );

  if (existing) {
    const next = syncDiscountFromPercent({
      ...existing,
      quantity: roundQty(existing.quantity + qty),
    });
    const nextItems = items.map((i) => (i.lineId === existing.lineId ? next : i));
    return {
      items: nextItems,
      orderDiscountAmount: capOrderDiscount(nextItems, currentOrderDiscount),
      lineId: next.lineId,
    };
  }

  const line = syncDiscountFromPercent(buildLine(product, qty));
  const nextItems = [...items, line];
  return {
    items: nextItems,
    orderDiscountAmount: capOrderDiscount(nextItems, currentOrderDiscount),
    lineId: line.lineId,
  };
}

export function insertSeparatePieceItemToCart(items, product, quantity = 1, currentOrderDiscount = 0) {
  const line = syncDiscountFromPercent(buildLine(product, quantity));
  const nextItems = [...items, line];
  return {
    items: nextItems,
    orderDiscountAmount: capOrderDiscount(nextItems, currentOrderDiscount),
    lineId: line.lineId,
  };
}

export function patchCartLineInCart(items, lineId, patch, currentOrderDiscount = 0) {
  const nextItems = items.map((item) => {
    if (item.lineId !== lineId) return item;
    return syncDiscountFromPercent({ ...item, ...patch });
  });
  return {
    items: nextItems,
    orderDiscountAmount: capOrderDiscount(nextItems, currentOrderDiscount),
  };
}

export function addWeightLineToCart(items, product, quantityKg, currentOrderDiscount = 0) {
  const line = syncDiscountFromPercent(buildLine(product, quantityKg));
  const nextItems = [...items, line];
  return {
    items: nextItems,
    orderDiscountAmount: capOrderDiscount(nextItems, currentOrderDiscount),
    lineId: line.lineId,
  };
}

export function updateQuantityInCart(items, lineId, quantity, currentOrderDiscount = 0) {
  const q = roundQty(quantity);
  if (q <= 0) {
    const nextItems = items.filter((i) => i.lineId !== lineId);
    return {
      items: nextItems,
      orderDiscountAmount: capOrderDiscount(nextItems, currentOrderDiscount),
    };
  }
  const nextItems = items.map((i) => {
    if (i.lineId !== lineId) return i;
    const next = { ...i, quantity: q };
    if (isPieceLikeProduct(i)) {
      next.quantity = Math.max(1, Math.round(q));
    }
    return syncDiscountFromPercent(next);
  });
  return {
    items: nextItems,
    orderDiscountAmount: capOrderDiscount(nextItems, currentOrderDiscount),
  };
}

export function updateDiscountPercentInCart(items, lineId, discountPercent, currentOrderDiscount = 0) {
  const pct = Math.max(0, Math.min(100, round2(discountPercent)));
  const nextItems = items.map((i) =>
    i.lineId === lineId ? syncDiscountFromPercent({ ...i, discountPercent: pct }) : i
  );
  return {
    items: nextItems,
    orderDiscountAmount: capOrderDiscount(nextItems, currentOrderDiscount),
  };
}

export function removeItemFromCart(items, lineId, currentOrderDiscount = 0) {
  const nextItems = items.filter((i) => i.lineId !== lineId);
  return {
    items: nextItems,
    orderDiscountAmount: capOrderDiscount(nextItems, currentOrderDiscount),
  };
}

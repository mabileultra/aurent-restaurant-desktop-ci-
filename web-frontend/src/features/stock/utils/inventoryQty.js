import { isMeasuredProduct, roundQty } from '../../../utils/quantityFormat';

export function inventoryQtyStep(product) {
  if (!isMeasuredProduct(product)) return 1;
  const scale = product?.quantityScale != null ? Number(product.quantityScale) : 3;
  if (scale <= 0) return 1;
  return 1 / 10 ** Math.min(scale, 3);
}

export function bumpInventoryQty(current, product, direction) {
  const step = inventoryQtyStep(product);
  const base = current === '' || current == null ? 0 : Number(current);
  const next = Math.max(0, (Number.isFinite(base) ? base : 0) + direction * step);
  if (!isMeasuredProduct(product)) return String(Math.round(next));
  const rounded = roundQty(next);
  return String(rounded).replace(/\.0+$/, '');
}

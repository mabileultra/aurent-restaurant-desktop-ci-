import { roundQty } from '../../../utils/quantityFormat';

const FINE_STEP_UNITS = new Set(['KG']);

function unitCodeOf(product) {
  if (product?.unitCode) return String(product.unitCode).toUpperCase();
  if (product?.saleType === 'WEIGHT') return 'KG';
  return 'PCS';
}

export function inventoryQtyStep(product) {
  if (!FINE_STEP_UNITS.has(unitCodeOf(product))) return 1;
  const scale = product?.quantityScale != null ? Number(product.quantityScale) : 3;
  if (!Number.isFinite(scale) || scale <= 0) return 1;
  return 1 / 10 ** Math.min(scale, 3);
}

export function bumpInventoryQty(current, product, direction) {
  const step = inventoryQtyStep(product);
  const base = current === '' || current == null ? 0 : Number(current);
  const next = Math.max(0, (Number.isFinite(base) ? base : 0) + direction * step);
  if (step >= 1) return String(Math.round(next));
  return String(roundQty(next)).replace(/\.0+$/, '');
}

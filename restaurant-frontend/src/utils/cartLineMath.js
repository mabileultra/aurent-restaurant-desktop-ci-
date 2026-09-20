import { round2 } from './taxAmounts';

/** Line math for fiscal / Multikassa (restaurant pay). Not a retail cart. */

export const lineGross = (item) => round2(Number(item.unitPrice || 0) * Number(item.quantity || 0));

export const lineDiscountAmount = (item) => {
  if (item.discount != null && item.discount > 0) {
    return round2(Math.min(item.discount, lineGross(item)));
  }
  const pct = Number(item.discountPercent) || 0;
  return round2(lineGross(item) * (pct / 100));
};

export const lineSubtotal = (item) => round2(lineGross(item) - lineDiscountAmount(item));

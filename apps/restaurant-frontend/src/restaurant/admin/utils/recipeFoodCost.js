import { fmtMoneyCompact } from '../../../utils/formatMoney';

/**
 * Food cost for a recipe: sum(gross qty × price per base unit) / output → per portion vs sell price.
 * Unit cost is the warehouse purchase price of 1 base unit (kg, l, pcs).
 * Gross is what leaves stock; net is only the yield after waste.
 */

export function lineIngredientCost(line, unitCost) {
  const qty = Number(line?.qtyGross);
  const cost = Number(unitCost);
  if (!(qty > 0) || !Number.isFinite(cost) || cost < 0) return null;
  return qty * cost;
}

/**
 * @param {{
 *   lines: Array<{ productId?: string, qtyGross?: string|number, costPrice?: string|number }>,
 *   costByProductId?: Record<string, number|null|undefined>,
 *   outputQty?: string|number,
 *   sellPrice?: string|number,
 * }} args
 */
export function computeRecipeFoodCost({
  lines = [],
  costByProductId = {},
  outputQty = 1,
  sellPrice = 0,
} = {}) {
  let batchCost = 0;
  let pricedLines = 0;
  let missingCost = false;

  for (const line of lines) {
    if (!line?.productId) continue;
    const qty = Number(line.qtyGross);
    if (!(qty > 0)) continue;

    const fromMap = costByProductId[line.productId];
    const unitCost = fromMap != null && fromMap !== ''
      ? Number(fromMap)
      : (line.costPrice != null && line.costPrice !== '' ? Number(line.costPrice) : NaN);

    if (!Number.isFinite(unitCost) || unitCost < 0) {
      missingCost = true;
      continue;
    }

    batchCost += qty * unitCost;
    pricedLines += 1;
  }

  const output = Math.max(Number(outputQty) || 0, 0.001);
  const portionCost = batchCost / output;
  const price = Number(sellPrice);
  const hasPrice = Number.isFinite(price) && price > 0;
  const percent = hasPrice ? (portionCost / price) * 100 : null;
  const margin = hasPrice ? price - portionCost : null;

  return {
    batchCost,
    portionCost,
    sellPrice: hasPrice ? price : 0,
    percent,
    margin,
    pricedLines,
    missingCost,
    high: percent != null && percent >= 35,
  };
}

export function formatUnitCost(amount, unit) {
  if (amount == null || !Number.isFinite(Number(amount))) return '—';
  const money = fmtMoneyCompact(amount);
  return unit ? `${money} / ${unit}` : money;
}

export function formatFoodCostPercent(percent) {
  if (percent == null || !Number.isFinite(percent)) return '—';
  return `${percent.toFixed(1)}%`;
}

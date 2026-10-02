import { describe, expect, it } from 'vitest';
import {
  computeRecipeFoodCost,
  formatFoodCostPercent,
  formatUnitCost,
  lineIngredientCost,
} from '../src/restaurant/admin/utils/recipeFoodCost.js';

describe('recipeFoodCost', () => {
  it('shows purchase price per the product unit', () => {
    expect(formatUnitCost(150000, 'kg')).toMatch(/150/);
    expect(formatUnitCost(150000, 'kg')).toContain('/ kg');
    expect(formatUnitCost(null, 'kg')).toBe('—');
  });

  it('lineIngredientCost multiplies gross × unit cost', () => {
    expect(lineIngredientCost({ qtyGross: '0.5' }, 10000)).toBe(5000);
    expect(lineIngredientCost({ qtyGross: 0 }, 100)).toBeNull();
  });

  it('computes portion cost and food-cost %', () => {
    const result = computeRecipeFoodCost({
      lines: [
        { productId: 'a', qtyGross: 0.2 },
        { productId: 'b', qtyGross: 0.1 },
      ],
      costByProductId: { a: 50000, b: 20000 },
      outputQty: 1,
      sellPrice: 45000,
    });
    expect(result.batchCost).toBe(12000);
    expect(result.portionCost).toBe(12000);
    expect(result.percent).toBeCloseTo(26.666, 2);
    expect(result.margin).toBe(33000);
    expect(result.high).toBe(false);
  });

  it('scales by output qty for batch recipes', () => {
    const result = computeRecipeFoodCost({
      lines: [{ productId: 'a', qtyGross: 1, costPrice: 10000 }],
      outputQty: 10,
      sellPrice: 5000,
    });
    expect(result.portionCost).toBe(1000);
    expect(result.percent).toBe(20);
  });

  it('flags high food cost at 35%+', () => {
    const result = computeRecipeFoodCost({
      lines: [{ productId: 'a', qtyGross: 1, costPrice: 4000 }],
      outputQty: 1,
      sellPrice: 10000,
    });
    expect(result.percent).toBe(40);
    expect(result.high).toBe(true);
  });

  it('marks missing costs without zeroing priced lines', () => {
    const result = computeRecipeFoodCost({
      lines: [
        { productId: 'a', qtyGross: 1, costPrice: 1000 },
        { productId: 'b', qtyGross: 1 },
      ],
      costByProductId: {},
      sellPrice: 10000,
    });
    expect(result.batchCost).toBe(1000);
    expect(result.missingCost).toBe(true);
    expect(result.pricedLines).toBe(1);
  });

  it('formatFoodCostPercent', () => {
    expect(formatFoodCostPercent(12.34)).toBe('12.3%');
    expect(formatFoodCostPercent(null)).toBe('—');
  });
});

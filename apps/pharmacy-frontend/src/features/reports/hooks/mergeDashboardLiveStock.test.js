import { describe, expect, it } from 'vitest';
import { mergeDashboardLiveStock } from './mergeDashboardLiveStock';

describe('mergeDashboardLiveStock', () => {
  it('overlays live retail and units onto dashboard payload', () => {
    const merged = mergeDashboardLiveStock(
      {
        currentStockUnits: 999,
        currentStockRetailEstimate: 1,
        currentStockCostEstimate: 2,
        soldUnits: 3,
      },
      {
        stockQuantityTotal: 10.4,
        stockValueTotal: 223586999.8,
        stockCostTotal: 100000.5,
      }
    );
    expect(merged.currentStockUnits).toBe(10);
    expect(merged.currentStockRetailEstimate).toBe(223586999.8);
    expect(merged.currentStockCostEstimate).toBe(100000.5);
    expect(merged.soldUnits).toBe(3);
  });
});

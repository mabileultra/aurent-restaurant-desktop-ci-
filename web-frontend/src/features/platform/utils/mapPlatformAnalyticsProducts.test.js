import { describe, expect, it } from 'vitest';
import { mapPlatformAnalyticsProducts } from './mapPlatformAnalyticsProducts';

describe('mapPlatformAnalyticsProducts', () => {
  it('maps kpi tops and product rows', () => {
    const mapped = mapPlatformAnalyticsProducts({
      period: '7d',
      periodFrom: '2026-10-01',
      periodTo: '2026-10-07',
      kpi: { soldQty: 100, revenue: 1000, cost: 700, profit: 300, marginPct: 30 },
      products: [{
        name: 'Cola',
        qty: 50,
        revenue: 500,
        cost: 300,
        profit: 200,
        marginPct: 40,
        growthPct: 12,
      }],
      topByQty: [{ name: 'Cola', value: 50 }],
      topByProfit: [{ name: 'Cola', value: 200 }],
      rising: [{ name: 'Cola', value: 12 }],
      falling: [],
      categories: [{ name: 'Drinks', qty: 50, revenue: 500, profit: 200 }],
    });
    expect(mapped.kpi.marginPct).toBe(30);
    expect(mapped.products[0].name).toBe('Cola');
    expect(mapped.topByProfit[0].value).toBe(200);
    expect(mapped.categories[0].name).toBe('Drinks');
  });
});

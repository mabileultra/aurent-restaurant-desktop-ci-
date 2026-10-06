import { describe, expect, it } from 'vitest';
import { mapPlatformAnalyticsOverview } from './mapPlatformAnalyticsOverview';

describe('mapPlatformAnalyticsOverview', () => {
  it('maps live api payload into overview UI shape', () => {
    const mapped = mapPlatformAnalyticsOverview({
      period: '7d',
      periodFrom: '2026-10-01',
      periodTo: '2026-10-07',
      demo: false,
      kpi: {
        turnover: { value: 1000, deltaPct: 10 },
        profit: { value: 200, deltaPct: null },
        salesQty: { value: 5, deltaPct: 1 },
        receipts: { value: 2, deltaPct: 0 },
        avgCheck: { value: 500, deltaPct: 2 },
        returns: { value: 10, deltaPct: -3 },
        activeStores: { value: 3, deltaPct: null },
      },
      daily: [{ date: '2026-10-01', label: '01.10', turnover: 100, profit: 20, receipts: 1, avgCheck: 100, best: true }],
      topStores: [{ name: 'A', turnover: 100, deltaPct: 5 }],
      topProductsQty: [{ name: 'Cola', qty: 9 }],
      topProductsProfit: [{ name: 'Cola', profit: 12 }],
      weekdays: [{ day: 'Пн', turnover: 10, sharePct: 10, peak: false }],
      payments: [{ id: 'cash', amount: 60, sharePct: 60 }],
      anomalies: [],
    });

    expect(mapped.demo).toBe(false);
    expect(mapped.periodLabel).toBe('01.10.2026 – 07.10.2026');
    expect(mapped.kpi.turnover.value).toBe(1000);
    expect(mapped.kpi.profit.deltaPct).toBeNull();
    expect(mapped.topProductsQty[0].qty).toBe(9);
    expect(mapped.heatmap.rows).toEqual([]);
  });
});

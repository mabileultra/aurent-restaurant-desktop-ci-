import { describe, expect, it } from 'vitest';
import { mapPlatformAnalyticsStores } from './mapPlatformAnalyticsStores';

describe('mapPlatformAnalyticsStores', () => {
  it('maps store rows and tops', () => {
    const mapped = mapPlatformAnalyticsStores({
      period: '7d',
      periodFrom: '2026-10-01',
      periodTo: '2026-10-07',
      stores: [{
        storeId: 1,
        name: 'MIRONKUL',
        turnover: 1000,
        profit: 200,
        receipts: 10,
        avgCheck: 100,
        growthPct: 12.5,
      }],
      topByTurnover: [{ storeId: 1, name: 'MIRONKUL', value: 1000 }],
      topByProfit: [{ storeId: 1, name: 'MIRONKUL', value: 200 }],
    });
    expect(mapped.stores[0].name).toBe('MIRONKUL');
    expect(mapped.stores[0].growthPct).toBe(12.5);
    expect(mapped.topByProfit[0].value).toBe(200);
  });
});

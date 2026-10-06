import { describe, expect, it } from 'vitest';
import { mapPlatformAnalyticsFiscal } from './mapPlatformAnalyticsFiscal';

describe('mapPlatformAnalyticsFiscal', () => {
  it('maps kpi and store rows', () => {
    const mapped = mapPlatformAnalyticsFiscal({
      period: '7d',
      periodFrom: '2026-10-01',
      periodTo: '2026-10-07',
      approximate: true,
      kpi: {
        fiscalTurnover: 1000,
        fiscalReceipts: 10,
        avgCheck: 100,
        returnsAmount: 50,
        returnsReceipts: 2,
        cancelledReceipts: 1,
        taxBase: 0,
        vat: 0,
        vatAvailable: false,
      },
      byStore: [{ storeId: 1, name: 'A', turnover: 800, receipts: 8, returnsAmount: 20, cancelledReceipts: 0 }],
    });
    expect(mapped.approximate).toBe(true);
    expect(mapped.kpi.vatAvailable).toBe(false);
    expect(mapped.byStore[0].name).toBe('A');
    expect(mapped.periodLabel).toBe('01.10.2026 – 07.10.2026');
  });
});

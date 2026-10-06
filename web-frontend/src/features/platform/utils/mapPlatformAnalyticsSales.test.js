import { describe, expect, it } from 'vitest';
import { mapPlatformAnalyticsSales } from './mapPlatformAnalyticsSales';

describe('mapPlatformAnalyticsSales', () => {
  it('maps kpi daily and peaks', () => {
    const mapped = mapPlatformAnalyticsSales({
      period: '7d',
      periodFrom: '2026-10-01',
      periodTo: '2026-10-07',
      kpi: {
        turnover: 1000,
        profit: 200,
        receipts: 10,
        avgCheck: 100,
        turnoverDeltaPct: 5,
        profitDeltaPct: null,
        receiptsDeltaPct: 2,
        avgCheckDeltaPct: 1,
      },
      daily: [{ date: '2026-10-05', label: '05.10', turnover: 300, profit: 60, receipts: 3, avgCheck: 100, best: true }],
      weekdays: [{ day: 'Сб', turnover: 400, sharePct: 40, peak: true }],
      hourly: [{ hour: '18', turnover: 200, receipts: 2, sharePct: 20 }],
      hourlyApproximate: true,
      peakDay: { label: '05.10', turnover: 300, sharePct: 30 },
      peakHour: { label: '18:00', turnover: 200, sharePct: 20 },
    });
    expect(mapped.kpi.turnover.deltaPct).toBe(5);
    expect(mapped.kpi.profit.deltaPct).toBeNull();
    expect(mapped.daily[0].best).toBe(true);
    expect(mapped.peakHour.label).toBe('18:00');
    expect(mapped.hourlyApproximate).toBe(true);
  });
});

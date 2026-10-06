import { describe, expect, it } from 'vitest';
import { mapPlatformAnalyticsPayments } from './mapPlatformAnalyticsPayments';

describe('mapPlatformAnalyticsPayments', () => {
  it('maps methods and daily split', () => {
    const mapped = mapPlatformAnalyticsPayments({
      period: '7d',
      periodFrom: '2026-10-01',
      periodTo: '2026-10-07',
      totalAmount: 1000,
      totalReceipts: 20,
      methods: [
        { id: 'cash', label: 'cash', amount: 600, receipts: 12, sharePct: 60 },
        { id: 'weird', label: 'weird', amount: 400, receipts: 8, sharePct: 40 },
      ],
      daily: [{ date: '2026-10-01', label: '01.10', cash: 100, card: 50, other: 10 }],
    });
    expect(mapped.periodLabel).toBe('01.10.2026 – 07.10.2026');
    expect(mapped.methods[0].labelKey).toBe('cash');
    expect(mapped.methods[1].labelKey).toBe('other');
    expect(mapped.daily[0].cash).toBe(100);
  });
});

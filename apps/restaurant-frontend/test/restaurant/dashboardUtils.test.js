import { describe, expect, it } from 'vitest';
import { customRangeIso, dashboardQueryParams } from '../../src/restaurant/admin/utils/dashboardPeriod.js';
import { resolveDashboardQuickActions } from '../../src/restaurant/admin/utils/dashboardQuickActions.js';
import { formatPctDelta, formatAbsDelta } from '../../src/restaurant/admin/utils/dashboardFormat.js';
import { toDashboardViewModel } from '../../src/restaurant/admin/utils/dashboardViewModel.js';

describe('dashboardPeriod', () => {
  it('defaults custom without dates to today', () => {
    expect(dashboardQueryParams('CUSTOM', '', '')).toEqual({ period: 'TODAY' });
  });

  it('builds custom range', () => {
    const params = dashboardQueryParams('CUSTOM', '2026-09-20', '2026-09-20');
    expect(params.period).toBe('CUSTOM');
    expect(params.from).toBeTruthy();
    expect(params.to).toBeTruthy();
  });

  it('rejects inverted custom range', () => {
    expect(customRangeIso('2026-09-21', '2026-09-20')).toBeNull();
  });
});

describe('dashboardQuickActions', () => {
  it('limits waiter actions', () => {
    const keys = resolveDashboardQuickActions('WAITER').map((a) => a.key);
    expect(keys).toEqual(['newOrder', 'floor', 'myOrders']);
  });

  it('gives owner full set', () => {
    const keys = resolveDashboardQuickActions('ADMIN').map((a) => a.key);
    expect(keys).toContain('kitchen');
    expect(keys).toContain('receipt');
  });
});

describe('dashboardFormat', () => {
  it('formats percent delta', () => {
    expect(formatPctDelta(8.4)).toBe('↑ 8.4%');
    expect(formatPctDelta(-2)).toBe('↓ 2.0%');
    expect(formatPctDelta(null)).toBeNull();
  });

  it('formats absolute delta', () => {
    expect(formatAbsDelta(12)).toBe('↑ 12');
  });
});

describe('dashboardViewModel', () => {
  it('flattens nested finance/ops/live blocks', () => {
    const view = toDashboardViewModel({
      periodKey: 'TODAY',
      from: 'a',
      to: 'b',
      finance: { revenue: 100, guests: 4, byHour: [{ hour: 10 }] },
      ops: { shiftOpen: true, freeTables: 2 },
      live: {
        tables: [{ tableCode: 'A1' }],
        kitchenQueue: [{ orderNo: 1 }],
        recentOrders: [{ orderNo: 9 }],
      },
    });
    expect(view.revenue).toBe(100);
    expect(view.guests).toBe(4);
    expect(view.shiftOpen).toBe(true);
    expect(view.liveTables).toEqual([{ tableCode: 'A1' }]);
    expect(view.kitchenQueue).toEqual([{ orderNo: 1 }]);
    expect(view.recentOrders).toEqual([{ orderNo: 9 }]);
    expect(view.byHour).toEqual([{ hour: 10 }]);
  });
});

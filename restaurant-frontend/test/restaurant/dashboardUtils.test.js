import { describe, expect, it } from 'vitest';
import { customRangeIso, dashboardQueryParams } from '../../src/restaurant/admin/utils/dashboardPeriod.js';
import { resolveDashboardQuickActions } from '../../src/restaurant/admin/utils/dashboardQuickActions.js';
import { formatPctDelta, formatAbsDelta } from '../../src/restaurant/admin/utils/dashboardFormat.js';

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

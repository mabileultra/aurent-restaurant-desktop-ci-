import { describe, expect, it } from 'vitest';
import {
  buildMonthGrid,
  computeCalendarKpis,
  formatDayTitle,
  formatMonthTitle,
  getDayStatusInfo,
  monthKey,
  shiftDay,
  shiftMonth,
} from './billingCalendarUtils';

describe('billingCalendarUtils', () => {
  it('formats monthKey correctly and timezone-safely', () => {
    expect(monthKey('2026-10')).toBe('2026-10');
    expect(monthKey('2026-10-31')).toBe('2026-10');
    expect(monthKey(new Date(2026, 9, 15))).toBe('2026-10');
    expect(monthKey(new Date(2026, 0, 1))).toBe('2026-01');
  });

  it('shifts month forwards and backwards correctly', () => {
    expect(shiftMonth('2026-10', 1)).toBe('2026-11');
    expect(shiftMonth('2026-10', -1)).toBe('2026-09');
    expect(shiftMonth('2026-01', -1)).toBe('2025-12');
    expect(shiftMonth('2026-12', 1)).toBe('2027-01');
  });

  it('shifts day correctly', () => {
    expect(shiftDay('2026-10-30', 1)).toBe('2026-10-31');
    expect(shiftDay('2026-10-31', 1)).toBe('2026-11-01');
    expect(shiftDay('2026-10-01', -1)).toBe('2026-09-30');
  });

  it('formats month and day titles without M10 or raw codes in uz and ru', () => {
    expect(formatMonthTitle('2026-10', 'uz')).toBe('Oktabr 2026');
    expect(formatMonthTitle('2026-10', 'ru')).toBe('Октябрь 2026');

    expect(formatDayTitle('2026-10-27', 'uz')).toBe('27-oktabr, 2026');
    expect(formatDayTitle('2026-10-27', 'ru')).toBe('27 октября 2026');
  });

  it('builds month grid aligned to Monday with full 7-column rows', () => {
    // October 2026 starts on Thursday (index 3 from Monday 0..6)
    const grid = buildMonthGrid('2026-10');
    expect(grid.length % 7).toBe(0);
    expect(grid.length).toBeGreaterThanOrEqual(35);

    // 1st of Oct should be in current month
    const oct1 = grid.find((c) => c.iso === '2026-10-01');
    expect(oct1).toBeDefined();
    expect(oct1.isOtherMonth).toBe(false);

    // September trailing days should be marked as other month
    const sep30 = grid.find((c) => c.iso === '2026-09-30');
    expect(sep30).toBeDefined();
    expect(sep30.isOtherMonth).toBe(true);
  });

  it('computes day status info and calendar KPIs accurately without inflating successful charges', () => {
    const mockItems = [
      { companyId: 1, amount: 200000, paymentState: 'ACTIVE' },
      { companyId: 2, amount: 300000, paymentState: 'OVERDUE' },
      { companyId: 3, amount: 150000, paymentState: 'SCHEDULED' }, // Planned, sufficient balance
      { companyId: 4, amount: 100000, paymentState: 'OVERDUE' }, // Has deferral
      { companyId: 5, amount: 250000, paymentState: 'SUSPENDED' },
    ];
    const companyMap = {
      1: { billing: { balance: 500000 } },
      2: { billing: { balance: -100000 } },
      3: { billing: { balance: 400000 } },
      4: { billing: { balance: 0, deferralUntil: '2026-11-05' } },
      5: { billing: { balance: 0 } },
    };

    const status = getDayStatusInfo(mockItems, companyMap);
    expect(status.count).toBe(5);
    expect(status.amount).toBe(1000000);
    expect(status.tone).toBe('danger'); // Overdue takes priority
    expect(status.successCount).toBe(1);
    expect(status.lowBalanceCount).toBe(1);
    expect(status.deferralCount).toBe(1);
    expect(status.plannedCount).toBe(1);
    expect(status.suspendedCount).toBe(1);

    const kpis = computeCalendarKpis([{ items: mockItems }], 0, 0, companyMap);
    expect(kpis.monthTotal.amount).toBe(1000000);
    expect(kpis.monthTotal.count).toBe(5);
    expect(kpis.successful.count).toBe(1);
    expect(kpis.successful.amount).toBe(200000);
    expect(kpis.lowBalance.count).toBe(1);
    expect(kpis.lowBalance.amount).toBe(300000);
    expect(kpis.deferral.count).toBe(1);
    expect(kpis.deferral.amount).toBe(100000);
    expect(kpis.suspended.count).toBe(1);
    expect(kpis.suspended.amount).toBe(250000);
    expect(kpis.planned.count).toBe(1);
    expect(kpis.planned.amount).toBe(150000);
  });
});

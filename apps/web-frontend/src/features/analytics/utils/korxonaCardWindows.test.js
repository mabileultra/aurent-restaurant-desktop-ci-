import { describe, expect, it } from 'vitest';
import { resolveRollingCardWindows } from './korxonaCardWindows';

describe('resolveRollingCardWindows', () => {
  it('uses newest day for Kunlik and rolling 7 for Haftalik', () => {
    const days = [
      { date: '2026-11-09', totalTurnover: 0 },
      { date: '2026-11-08', totalTurnover: 100 },
      { date: '2026-11-07', totalTurnover: 200 },
      { date: '2026-11-06', totalTurnover: 0 },
      { date: '2026-11-05', totalTurnover: 50 },
      { date: '2026-11-04', totalTurnover: 0 },
      { date: '2026-11-03', totalTurnover: 150 },
      { date: '2026-11-02', totalTurnover: 1000 },
      { date: '2026-11-01', totalTurnover: 0 },
      { date: '2026-10-31', totalTurnover: 0 },
      { date: '2026-10-30', totalTurnover: 0 },
      { date: '2026-10-29', totalTurnover: 0 },
      { date: '2026-10-28', totalTurnover: 0 },
      { date: '2026-10-27', totalTurnover: 500 },
      { date: '2026-10-11', totalTurnover: 0 },
    ];

    const win = resolveRollingCardWindows(days);
    expect(win.dayDate).toBe('2026-11-09');
    expect(win.dayVal).toBe(0);
    expect(win.weekFrom).toBe('2026-11-03');
    expect(win.weekTo).toBe('2026-11-09');
    expect(win.weekVal).toBe(500);
    expect(win.weekDelta).toBe(-66.7);
  });

  it('does not treat oldest period day as Kunlik', () => {
    const days = [
      { date: '2026-11-09', totalTurnover: 12 },
      { date: '2026-10-11', totalTurnover: 999 },
    ];
    const win = resolveRollingCardWindows(days);
    expect(win.dayDate).toBe('2026-11-09');
    expect(win.dayVal).toBe(12);
  });
});

import { describe, expect, it } from 'vitest';
import {
  formatHistoryDateHeader,
  formatHistoryTime,
  formatHistoryDiff,
} from './historyFormatUtils';

describe('historyFormatUtils', () => {
  it('formats today date cleanly without M11 bug', () => {
    const now = new Date();
    const uz = formatHistoryDateHeader(now, false);
    expect(uz).toContain('BUGUN ·');
    expect(uz).not.toContain('M11');
    expect(uz).not.toContain('M01');

    const ru = formatHistoryDateHeader(now, true);
    expect(ru).toContain('СЕГОДНЯ ·');
  });

  it('formats past dates with correct month string', () => {
    const past = new Date(2026, 9, 30); // 30 October 2026
    const uz = formatHistoryDateHeader(past, false);
    expect(uz).toBe('30-OKTABR');
  });

  it('formats time in HH:mm', () => {
    const d = new Date(2026, 10, 7, 14, 5);
    expect(formatHistoryTime(d)).toBe('14:05');
  });

  it('computes diffs between before and after modules', () => {
    const before = { cashierPos: true, restaurantKitchen: false };
    const after = { cashierPos: true, restaurantKitchen: true, restaurantFloor: true };

    const diff = formatHistoryDiff(before, after, 'UPDATE', false);
    expect(diff).toContain('+ Oshxona');
    expect(diff).toContain('+ Zal va stollar');
  });
});

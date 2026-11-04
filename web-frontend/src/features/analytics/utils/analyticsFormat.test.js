import { describe, expect, it } from 'vitest';
import {
  fmtDayFull,
  fmtDayShort,
  fmtMoney,
  fmtNum,
  fmtPercent,
  fmtQty,
} from './analyticsFormat';

describe('analyticsFormat', () => {
  it('formats numbers with thousand separators', () => {
    expect(fmtNum(1234567)).toBe('1\u00A0234\u00A0567');
    expect(fmtNum(null)).toBe('—');
    expect(fmtNum(undefined)).toBe('—');
  });

  it('formats money in billions, millions, and thousands', () => {
    expect(fmtMoney(4400000000)).toContain('4,4 mlrd so‘m');
    expect(fmtMoney(154000000)).toContain('154 mln so‘m');
    expect(fmtMoney(25000)).toContain('25\u00A0000 so‘m');
    expect(fmtMoney(null)).toBe('—');
  });

  it('formats percentage with optional plus', () => {
    expect(fmtPercent(633.6, true)).toBe('+633,6%');
    expect(fmtPercent(-12.4, true)).toBe('-12,4%');
    expect(fmtPercent(28.1)).toBe('28,1%');
    expect(fmtPercent(null)).toBe('—');
  });

  it('formats quantities correctly', () => {
    expect(fmtQty(21994)).toBe('21\u00A0994');
    expect(fmtQty(null)).toBe('—');
  });

  it('formats short and full dates in Uzbek', () => {
    expect(fmtDayShort('2026-10-24')).toBe('24-okt');
    expect(fmtDayFull('2026-10-24')).toContain('24-oktabr, shanba');
    expect(fmtDayShort('')).toBe('—');
  });
});

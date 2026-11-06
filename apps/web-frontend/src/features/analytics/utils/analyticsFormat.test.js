import { describe, expect, it } from 'vitest';
import {
  fmtDayFull,
  fmtDayShort,
  fmtDeltaBadge,
  fmtMoney,
  fmtNum,
  fmtPercent,
  fmtPercentText,
  fmtQty,
  fmtTimeUz,
  fmtDateTimeUz,
  sanitizeText,
} from './analyticsFormat';

describe('analyticsFormat', () => {
  it('formats numbers with thousand separators', () => {
    expect(fmtNum(1234567)).toBe('1\u00A0234\u00A0567');
    expect(fmtNum(null)).toBe('0');
  });

  it('formats money in billions, millions, and thousands', () => {
    expect(fmtMoney(4400000000)).toContain('4,40 mlrd so‘m');
    expect(fmtMoney(154000000)).toContain('154,0 mln so‘m');
    expect(fmtMoney(25000)).toContain('25\u00A0000 so‘m');
    expect(fmtMoney(null)).toBe('0');
  });

  it('formats percentage with optional plus and comma separator', () => {
    expect(fmtPercent(633.6, true)).toBe('+633,6%');
    expect(fmtPercent(-12.4, true)).toBe('−12,4%');
    expect(fmtPercent(28.1)).toBe('28,1%');
    expect(fmtPercentText(97.6)).toBe('97,6 foizi');
  });

  it('formats delta badges properly with arrow', () => {
    expect(fmtDeltaBadge(24.8).text).toBe('↑ 24,8%');
    expect(fmtDeltaBadge(24.8).dir).toBe('up');
    expect(fmtDeltaBadge(-35.5).text).toBe('↓ 35,5%');
    expect(fmtDeltaBadge(-35.5).dir).toBe('dn');
  });

  it('formats quantities correctly', () => {
    expect(fmtQty(21994)).toBe('21\u00A0994');
    expect(fmtQty(null)).toBe('0');
  });

  it('formats short and full dates in Uzbek', () => {
    expect(fmtDayShort('2026-10-24')).toBe('24-okt');
    expect(fmtDayFull('2026-10-24')).toContain('24-oktabr, shanba');
    expect(fmtDayShort('')).toBe('—');
  });

  it('formats time and datetime in Tashkent timezone', () => {
    // 2026-11-02T09:35:12.584081Z is 14:35 in Tashkent (UTC+5)
    expect(fmtTimeUz('2026-11-02T09:35:12.584081Z')).toBe('14:35');
    expect(fmtTimeUz('14:35')).toBe('14:35');
    expect(fmtTimeUz(null)).toBe('—');
    expect(fmtDateTimeUz('2026-11-02T09:35:12.584081Z')).toContain('2-noyabr, 14:35');
    expect(fmtDateTimeUz('')).toBe('—');
  });
});

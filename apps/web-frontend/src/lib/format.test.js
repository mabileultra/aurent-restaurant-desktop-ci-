import { describe, it, expect } from 'vitest';
import {
  formatSum,
  formatShort,
  formatPercent,
  formatDate,
  formatAny,
} from './format';

const NBSP = '\u00A0';

describe('formatSum', () => {
  it('formats regular amounts with thousand separators and U+2018 so‘m', () => {
    expect(formatSum(512400)).toBe(`512${NBSP}400${NBSP}so\u2018m`);
    expect(formatSum(0)).toBe(`0${NBSP}so\u2018m`);
    expect(formatSum('512400')).toBe(`512${NBSP}400${NBSP}so\u2018m`);
  });

  it('guarantees non-breaking space (NBSP U+00A0) before so‘m, not regular space', () => {
    const formatted = formatSum(512400);
    expect(formatted).toContain(`${NBSP}so\u2018m`);
    expect(formatted.includes(' so\u2018m')).toBe(false);
  });

  it('handles negative amounts correctly with minus sign', () => {
    expect(formatSum(-512400)).toBe(`-512${NBSP}400${NBSP}so\u2018m`);
    expect(formatSum('-1500')).toBe(`-1${NBSP}500${NBSP}so\u2018m`);
  });

  it('returns dash on null, undefined, empty, or NaN', () => {
    expect(formatSum(null)).toBe('—');
    expect(formatSum(undefined)).toBe('—');
    expect(formatSum(NaN)).toBe('—');
    expect(formatSum('')).toBe('—');
    expect(formatSum('abc')).toBe('—');
  });
});

describe('formatShort', () => {
  it('formats trillions (≥1e12)', () => {
    expect(formatShort(1.5e12)).toBe(`1,5${NBSP}trln${NBSP}so\u2018m`);
    expect(formatShort(-1.5e12)).toBe(`-1,5${NBSP}trln${NBSP}so\u2018m`);
    expect(formatShort(1e12)).toBe(`1${NBSP}trln${NBSP}so\u2018m`);
  });

  it('formats billions with up to two decimal places', () => {
    expect(formatShort(4705580191)).toBe(`4,71${NBSP}mlrd${NBSP}so\u2018m`);
  });

  it('formats millions with comma decimal', () => {
    expect(formatShort(512439000)).toBe(`512,4${NBSP}mln${NBSP}so\u2018m`);
  });

  it('formats thousands: 1 decimal if < 10k, integer if >= 10k', () => {
    expect(formatShort(1500)).toBe(`1,5${NBSP}ming${NBSP}so\u2018m`);
    expect(formatShort(-1500)).toBe(`-1,5${NBSP}ming${NBSP}so\u2018m`);
    expect(formatShort(1000)).toBe(`1${NBSP}ming${NBSP}so\u2018m`);
    expect(formatShort(25749)).toBe(`26${NBSP}ming${NBSP}so\u2018m`);
  });

  it('handles rollover from thousands to millions at 999950 threshold', () => {
    expect(formatShort(999950)).toBe(`1${NBSP}mln${NBSP}so\u2018m`);
    expect(formatShort(-999950)).toBe(`-1${NBSP}mln${NBSP}so\u2018m`);
  });

  it('handles rollover from millions to billions at 999950000 threshold', () => {
    expect(formatShort(999950000)).toBe(`1${NBSP}mlrd${NBSP}so\u2018m`);
    expect(formatShort(-999950000)).toBe(`-1${NBSP}mlrd${NBSP}so\u2018m`);
  });

  it('formats small amounts directly', () => {
    expect(formatShort(850)).toBe(`850${NBSP}so\u2018m`);
  });

  it('handles negative short amounts for all tiers', () => {
    expect(formatShort(-4705580191)).toBe(`-4,71${NBSP}mlrd${NBSP}so\u2018m`);
    expect(formatShort(-512439000)).toBe(`-512,4${NBSP}mln${NBSP}so\u2018m`);
    expect(formatShort(-25749)).toBe(`-26${NBSP}ming${NBSP}so\u2018m`);
    expect(formatShort(-850)).toBe(`-850${NBSP}so\u2018m`);
  });

  it('guarantees NBSP before units and so‘m in short format', () => {
    const formatted = formatShort(512439000);
    expect(formatted).toContain(`${NBSP}mln${NBSP}so\u2018m`);
    expect(formatted.includes(' mln ')).toBe(false);
  });

  it('returns dash on invalid input', () => {
    expect(formatShort(null)).toBe('—');
    expect(formatShort(undefined)).toBe('—');
    expect(formatShort(NaN)).toBe('—');
    expect(formatShort('')).toBe('—');
  });
});

describe('formatPercent', () => {
  it('formats percentages with 1 decimal and comma', () => {
    expect(formatPercent(24.31)).toBe('24,3%');
    expect(formatPercent(0)).toBe('0,0%');
  });

  it('handles negative percentage', () => {
    expect(formatPercent(-3.12)).toBe('-3,1%');
  });

  it('returns dash on invalid input', () => {
    expect(formatPercent(null)).toBe('—');
    expect(formatPercent(undefined)).toBe('—');
    expect(formatPercent(NaN)).toBe('—');
    expect(formatPercent('')).toBe('—');
  });
});

describe('formatDate', () => {
  it('formats pure date string (YYYY-MM-DD) as-is', () => {
    expect(formatDate('2026-11-09')).toBe(`9-noyabr,${NBSP}2026`);
    expect(formatDate('2026-11-09', 'short')).toBe('9-noy');
  });

  it('formats ISO UTC timestamp string taking Asia/Tashkent time into account', () => {
    // 20:00 UTC on Nov 9 is 01:00 on Nov 10 in Tashkent (UTC+5)
    expect(formatDate('2026-11-09T20:00:00Z')).toBe(`10-noyabr,${NBSP}2026`);
    expect(formatDate('2026-11-09T20:00:00Z', 'short')).toBe('10-noy');

    // 18:59:59 UTC on Nov 9 is 23:59:59 on Nov 9 in Tashkent (UTC+5)
    expect(formatDate('2026-11-09T18:59:59Z')).toBe(`9-noyabr,${NBSP}2026`);
    expect(formatDate('2026-11-09T18:59:59Z', 'short')).toBe('9-noy');
  });

  it('handles Date objects with Tashkent timezone', () => {
    const d = new Date(Date.UTC(2026, 0, 15, 12, 0, 0));
    expect(formatDate(d)).toBe(`15-yanvar,${NBSP}2026`);
    expect(formatDate(d, 'short')).toBe('15-yan');
  });

  it('returns dash on invalid date or null', () => {
    expect(formatDate(null)).toBe('—');
    expect(formatDate(undefined)).toBe('—');
    expect(formatDate('')).toBe('—');
    expect(formatDate('invalid')).toBe('—');
  });
});

describe('formatAny', () => {
  it('returns dash on null, undefined, empty, or NaN', () => {
    expect(formatAny(null)).toBe('—');
    expect(formatAny(undefined)).toBe('—');
    expect(formatAny(NaN)).toBe('—');
    expect(formatAny('')).toBe('—');
  });

  it('returns string value for present values', () => {
    expect(formatAny('test')).toBe('test');
    expect(formatAny(123)).toBe('123');
    expect(formatAny(0)).toBe('0');
  });
});

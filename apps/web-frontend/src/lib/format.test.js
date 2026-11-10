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

  it('handles negative amounts', () => {
    expect(formatSum(-512400)).toBe(`-512${NBSP}400${NBSP}so\u2018m`);
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
  it('formats billions with up to two decimal places', () => {
    expect(formatShort(4705580191)).toBe(`4,71${NBSP}mlrd${NBSP}so\u2018m`);
  });

  it('formats millions with comma decimal', () => {
    expect(formatShort(512439000)).toBe(`512,4${NBSP}mln${NBSP}so\u2018m`);
  });

  it('formats thousands rounded to nearest integer', () => {
    expect(formatShort(25749)).toBe(`26${NBSP}ming${NBSP}so\u2018m`);
  });

  it('formats small amounts directly', () => {
    expect(formatShort(850)).toBe(`850${NBSP}so\u2018m`);
  });

  it('handles negative short amounts', () => {
    expect(formatShort(-4705580191)).toBe(`-4,71${NBSP}mlrd${NBSP}so\u2018m`);
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

  it('returns dash on invalid input', () => {
    expect(formatPercent(null)).toBe('—');
    expect(formatPercent(undefined)).toBe('—');
    expect(formatPercent(NaN)).toBe('—');
    expect(formatPercent('')).toBe('—');
  });
});

describe('formatDate', () => {
  it('formats full date in Uzbek', () => {
    expect(formatDate('2026-11-09')).toBe(`9-noyabr,${NBSP}2026`);
  });

  it('formats short date in Uzbek', () => {
    expect(formatDate('2026-11-09', 'short')).toBe('9-noy');
  });

  it('handles Date objects', () => {
    const d = new Date(2026, 0, 15);
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

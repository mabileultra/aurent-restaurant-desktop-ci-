import { describe, expect, it } from 'vitest';
import {
  formatDateFull,
  formatRelative,
  formatUzbekDate,
  resolveLocale,
} from './desktopNotificationFormatters';

describe('desktopNotificationFormatters', () => {
  it('resolves correct date-fns locale', () => {
    expect(resolveLocale('uz')?.code).toBe('uz');
    expect(resolveLocale('ru')?.code).toBe('ru');
    expect(resolveLocale('en')?.code).toBe('ru');
  });

  it('formats full date in Uzbek and Russian', () => {
    const iso = '2026-10-30T10:00:00Z';
    const uzFormatted = formatDateFull(iso, 'uz');
    const ruFormatted = formatDateFull(iso, 'ru');
    expect(uzFormatted).toBeTruthy();
    expect(ruFormatted).toBeTruthy();
    expect(formatDateFull('invalid-date', 'uz')).toBe('—');
  });

  it('formats relative date correctly', () => {
    const nowIso = new Date().toISOString();
    const rel = formatRelative(nowIso, 'uz');
    expect(typeof rel).toBe('string');
    expect(formatRelative('invalid-date', 'uz')).toBe('');
  });

  it('formats uzbek custom pattern safely', () => {
    const iso = '2026-10-30T10:00:00Z';
    const formatted = formatUzbekDate(iso, 'yyyy-MM-dd', 'uz');
    expect(formatted).toBe('2026-10-30');
  });
});

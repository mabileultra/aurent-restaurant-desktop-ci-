import { describe, expect, it } from 'vitest';
import {
  calculateDaysInclusive,
  formatDisplayDate,
  formatMonthTitle,
  getMonthGridDays,
  getPickerText,
  getPresets,
  toIsoDate,
} from './platformDatePickerUtils';

describe('platformDatePickerUtils', () => {
  it('toIsoDate formats Date objects and ISO strings correctly', () => {
    expect(toIsoDate('2026-10-26')).toBe('2026-10-26');
    expect(toIsoDate(new Date(2026, 9, 26))).toBe('2026-10-26');
    expect(toIsoDate('')).toBe('');
    expect(toIsoDate(null)).toBe('');
    expect(toIsoDate('invalid')).toBe('');
  });

  it('formatDisplayDate formats ISO date to DD.MM.YYYY', () => {
    expect(formatDisplayDate('2026-10-26')).toBe('26.10.2026');
    expect(formatDisplayDate('2026-01-05')).toBe('05.01.2026');
    expect(formatDisplayDate('')).toBe('');
    expect(formatDisplayDate(null)).toBe('');
  });

  it('formatMonthTitle formats with capitalized month name in uz and ru', () => {
    const d = new Date(2026, 9, 1);
    expect(formatMonthTitle(d, false)).toBe('Oktabr 2026');
    expect(formatMonthTitle(d, true)).toBe('Октябрь 2026');
  });

  it('getMonthGridDays generates 7-column grid starting on Monday', () => {
    const d = new Date(2026, 9, 1); // October 2026
    const days = getMonthGridDays(d);
    expect(days.length % 7).toBe(0);
    // 2026-10-01 was Thursday, so first day of week starting on Monday is Monday 2026-09-28
    expect(days[0].iso).toBe('2026-09-28');
    expect(days[0].date.getDay()).toBe(1); // Monday
    expect(days[0].isCurrentMonth).toBe(false);

    // Oct 1st
    const oct1 = days.find((x) => x.iso === '2026-10-01');
    expect(oct1?.isCurrentMonth).toBe(true);
    expect(oct1?.dayNumber).toBe(1);

    // Last day of grid should be Sunday
    expect(days[days.length - 1].date.getDay()).toBe(0); // Sunday
  });

  it('getMonthGridDays handles leap year February 2024 correctly', () => {
    const leapFeb = new Date(2024, 1, 1); // Feb 2024 (29 days)
    const days = getMonthGridDays(leapFeb);
    const feb29 = days.find((d) => d.iso === '2024-02-29');
    expect(feb29).toBeDefined();
    expect(feb29?.isCurrentMonth).toBe(true);
    expect(feb29?.dayNumber).toBe(29);
  });

  it('calculateDaysInclusive calculates inclusive day count and handles edge cases', () => {
    expect(calculateDaysInclusive('2026-10-20', '2026-10-26')).toBe(7);
    expect(calculateDaysInclusive('2026-10-26', '2026-10-26')).toBe(1);
    expect(calculateDaysInclusive('', '2026-10-26')).toBe(0);
    expect(calculateDaysInclusive('2026-10-26', '')).toBe(0);
    expect(calculateDaysInclusive('invalid', '2026-10-26')).toBe(0);
  });

  it('getPresets generates 7 standard presets', () => {
    const fixedToday = new Date(2026, 9, 26);
    const presets = getPresets(fixedToday);
    expect(presets.length).toBe(7);

    const today = presets.find((p) => p.id === 'today');
    expect(today?.range).toEqual({ from: '2026-10-26', to: '2026-10-26' });

    const yesterday = presets.find((p) => p.id === 'yesterday');
    expect(yesterday?.range).toEqual({ from: '2026-10-25', to: '2026-10-25' });

    const last7 = presets.find((p) => p.id === 'last7Days');
    expect(last7?.range).toEqual({ from: '2026-10-20', to: '2026-10-26' });

    const last30 = presets.find((p) => p.id === 'last30Days');
    expect(last30?.range).toEqual({ from: '2026-09-27', to: '2026-10-26' });

    const thisMonth = presets.find((p) => p.id === 'thisMonth');
    expect(thisMonth?.range).toEqual({ from: '2026-10-01', to: '2026-10-31' });

    const lastMonth = presets.find((p) => p.id === 'lastMonth');
    expect(lastMonth?.range).toEqual({ from: '2026-09-01', to: '2026-09-30' });

    const allTime = presets.find((p) => p.id === 'allTime');
    expect(allTime?.range).toEqual({ from: '', to: '' });
  });

  it('getPickerText provides localization in uz and ru with pluralization', () => {
    expect(getPickerText('today', 'uz')).toBe('Bugun');
    expect(getPickerText('today', 'ru')).toBe('Сегодня');

    expect(getPickerText('daysCount', 'uz', null, { count: 5 })).toBe('5 kun');
    expect(getPickerText('daysCount', 'ru', null, { count: 1 })).toBe('1 день');
    expect(getPickerText('daysCount', 'ru', null, { count: 2 })).toBe('2 дня');
    expect(getPickerText('daysCount', 'ru', null, { count: 5 })).toBe('5 дней');

    expect(getPickerText('quickDays', 'uz', null, { count: 7 })).toBe('+7 kun');
    expect(getPickerText('quickDays', 'ru', null, { count: 7 })).toBe('+7 дней');

    expect(getPickerText('prevYear', 'uz')).toBe('Oldingi yil');
    expect(getPickerText('nextYear', 'uz')).toBe('Keyingi yil');
    expect(getPickerText('prevYear', 'ru')).toBe('Предыдущий год');
    expect(getPickerText('nextYear', 'ru')).toBe('Следующий год');
  });
});

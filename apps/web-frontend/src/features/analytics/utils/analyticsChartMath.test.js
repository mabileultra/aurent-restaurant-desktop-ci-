import { describe, expect, it } from 'vitest';
import {
  calculateChartNiceScale,
  calculateCrosshairIndex,
  resolveInactiveDaysNote,
} from './analyticsChartMath';

describe('analyticsChartMath', () => {
  describe('calculateChartNiceScale', () => {
    it('produces clean 250 mln step ticks for 1.22e9', () => {
      const res = calculateChartNiceScale(1.22e9, 5);
      expect(res.step).toBe(250000000);
      expect(res.maxVal).toBe(1250000000);
      expect(res.ticks).toEqual([
        0,
        250000000,
        500000000,
        750000000,
        1000000000,
        1250000000,
      ]);
    });

    it('falls back safely for 0 or negative values', () => {
      const res = calculateChartNiceScale(0, 5);
      expect(res.maxVal).toBe(1000000);
      expect(res.ticks).toHaveLength(6);
    });
  });

  describe('resolveInactiveDaysNote', () => {
    it('returns positive message when all days have sales', () => {
      const points = [
        { total: 100 },
        { total: 200 },
      ];
      const note = resolveInactiveDaysNote(points);
      expect(note.text).toBe('Barcha kunlarda savdo bor');
      expect(note.isWarning).toBe(false);
    });

    it('formats trailing zero days like 3–4-noyabr: cheklar kelmagan', () => {
      const points = [
        { total: 100, date: '1-noy', fullDate: '1-noyabr, yakshanba' },
        { total: 200, date: '2-noy', fullDate: '2-noyabr, dushanba' },
        { total: 0, date: '3-noy', fullDate: '3-noyabr, seshanba' },
        { total: 0, date: '4-noy', fullDate: '4-noyabr, chorshanba' },
      ];
      const note = resolveInactiveDaysNote(points);
      expect(note.text).toBe('3–4-noyabr: cheklar kelmagan');
      expect(note.isWarning).toBe(true);
    });

    it('formats single trailing zero day correctly', () => {
      const points = [
        { total: 100, date: '3-noy', fullDate: '3-noyabr, seshanba' },
        { total: 0, date: '4-noy', fullDate: '4-noyabr, chorshanba' },
      ];
      const note = resolveInactiveDaysNote(points);
      expect(note.text).toBe('4-noyabr: cheklar kelmagan');
      expect(note.isWarning).toBe(true);
    });
  });

  describe('calculateCrosshairIndex', () => {
    it('clamps between 0 and totalPoints - 1', () => {
      expect(calculateCrosshairIndex(-10, 0, 100, 10)).toBe(0);
      expect(calculateCrosshairIndex(150, 0, 100, 10)).toBe(9);
      expect(calculateCrosshairIndex(50, 0, 100, 11)).toBe(5);
    });
  });
});

import { describe, expect, it } from 'vitest';
import {
  formatNumberWithSpaces,
  getHistoryStatusBadge,
  getHistoryTypeBadge,
} from './emailFormatUtils';

describe('emailFormatUtils', () => {
  describe('formatNumberWithSpaces', () => {
    it('formats numbers with space separators', () => {
      expect(formatNumberWithSpaces(1284)).toBe('1 284');
      expect(formatNumberWithSpaces(1000000)).toBe('1 000 000');
      expect(formatNumberWithSpaces(42)).toBe('42');
      expect(formatNumberWithSpaces(0)).toBe('0');
      expect(formatNumberWithSpaces(null)).toBe('0');
      expect(formatNumberWithSpaces(undefined)).toBe('0');
    });
  });

  describe('getHistoryStatusBadge', () => {
    it('returns queued badge when queued > 0', () => {
      const b = getHistoryStatusBadge({ queued: 5, ok: 10, fail: 0 });
      expect(b.label).toBe('Yuborilmoqda');
      expect(b.className).toContain('bg-blue-100');
    });

    it('returns delivered badge when fail is 0 and queued is 0', () => {
      const b = getHistoryStatusBadge({ queued: 0, ok: 10, fail: 0 });
      expect(b.label).toBe('Yetkazildi');
      expect(b.className).toContain('bg-emerald-100');
    });

    it('returns undelivered badge when ok is 0 and fail > 0', () => {
      const b = getHistoryStatusBadge({ queued: 0, ok: 0, fail: 2 });
      expect(b.label).toBe('Yetkazilmadi');
      expect(b.className).toContain('bg-rose-100');
    });

    it('returns partial badge when ok > 0 and fail > 0', () => {
      const b = getHistoryStatusBadge({ queued: 0, ok: 10, fail: 2 });
      expect(b.label).toBe('Qisman');
      expect(b.className).toContain('bg-amber-100');
    });
  });

  describe('getHistoryTypeBadge', () => {
    it('returns badges for known types', () => {
      expect(getHistoryTypeBadge('bulk').label).toBe('Ommaviy');
      expect(getHistoryTypeBadge('cred').label).toBe('Kirish ma’lumotlari');
      expect(getHistoryTypeBadge('login').label).toBe('Super-admin kirishi');
      expect(getHistoryTypeBadge('custom').label).toBe('custom');
    });
  });
});

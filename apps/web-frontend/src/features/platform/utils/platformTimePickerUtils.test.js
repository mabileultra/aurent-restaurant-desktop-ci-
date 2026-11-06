import { describe, expect, it } from 'vitest';
import {
  formatTimeString,
  generateHourOptions,
  generateMinuteOptions,
  getCurrentTimeString,
  isValidTimeString,
  padZero,
  parseTimeString,
} from './platformTimePickerUtils';

describe('platformTimePickerUtils', () => {
  describe('padZero', () => {
    it('pads single digits with leading zero', () => {
      expect(padZero(0)).toBe('00');
      expect(padZero(5)).toBe('05');
      expect(padZero(9)).toBe('09');
    });

    it('keeps two digit numbers as string', () => {
      expect(padZero(10)).toBe('10');
      expect(padZero(23)).toBe('23');
    });

    it('handles negative or invalid input defensively', () => {
      expect(padZero(-5)).toBe('00');
      expect(padZero(NaN)).toBe('00');
      expect(padZero('abc')).toBe('00');
    });
  });

  describe('isValidTimeString', () => {
    it('validates 24-hour format HH:mm strings', () => {
      expect(isValidTimeString('00:00')).toBe(true);
      expect(isValidTimeString('09:30')).toBe(true);
      expect(isValidTimeString('14:45')).toBe(true);
      expect(isValidTimeString('23:59')).toBe(true);
    });

    it('rejects invalid time strings', () => {
      expect(isValidTimeString('24:00')).toBe(false);
      expect(isValidTimeString('12:60')).toBe(false);
      expect(isValidTimeString('9:30')).toBe(false);
      expect(isValidTimeString('14:5')).toBe(false);
      expect(isValidTimeString('')).toBe(false);
      expect(isValidTimeString(null)).toBe(false);
      expect(isValidTimeString(undefined)).toBe(false);
      expect(isValidTimeString('invalid')).toBe(false);
    });
  });

  describe('parseTimeString', () => {
    it('correctly parses valid time strings', () => {
      expect(parseTimeString('14:35')).toEqual({
        hours: 14,
        minutes: 35,
        formatted: '14:35',
      });
      expect(parseTimeString('08:05')).toEqual({
        hours: 8,
        minutes: 5,
        formatted: '08:05',
      });
    });

    it('falls back when given an invalid time string', () => {
      expect(parseTimeString('invalid', '10:15')).toEqual({
        hours: 10,
        minutes: 15,
        formatted: '10:15',
      });
      expect(parseTimeString('', '09:00')).toEqual({
        hours: 9,
        minutes: 0,
        formatted: '09:00',
      });
    });
  });

  describe('formatTimeString', () => {
    it('formats hours and minutes into 2-digit HH:mm string', () => {
      expect(formatTimeString(7, 5)).toBe('07:05');
      expect(formatTimeString(19, 45)).toBe('19:45');
    });

    it('clamps values out of bounds', () => {
      expect(formatTimeString(25, 65)).toBe('23:59');
      expect(formatTimeString(-1, -10)).toBe('00:00');
    });
  });

  describe('generateHourOptions', () => {
    it('generates 24 hours from 00 to 23', () => {
      const hours = generateHourOptions();
      expect(hours).toHaveLength(24);
      expect(hours[0]).toBe('00');
      expect(hours[23]).toBe('23');
    });
  });

  describe('generateMinuteOptions', () => {
    it('generates minutes with step 5 by default', () => {
      const minutes = generateMinuteOptions(5);
      expect(minutes).toHaveLength(12);
      expect(minutes[0]).toBe('00');
      expect(minutes[1]).toBe('05');
      expect(minutes[11]).toBe('55');
    });

    it('supports step 1', () => {
      const minutes = generateMinuteOptions(1);
      expect(minutes).toHaveLength(60);
      expect(minutes[0]).toBe('00');
      expect(minutes[59]).toBe('59');
    });
  });

  describe('getCurrentTimeString', () => {
    it('returns a valid HH:mm string', () => {
      const timeStr = getCurrentTimeString();
      expect(isValidTimeString(timeStr)).toBe(true);
    });
  });
});

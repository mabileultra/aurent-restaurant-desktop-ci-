import { describe, expect, it, vi } from 'vitest';
import {
  formatMoneyInputDigits,
  parseMoneyInput,
  preventNonNumericKey,
} from './parseMoneyInput';

describe('parseMoneyInput utils', () => {
  describe('parseMoneyInput', () => {
    it('parses valid numeric strings and formatted strings', () => {
      expect(parseMoneyInput('1000')).toBe(1000);
      expect(parseMoneyInput('1 000 000')).toBe(1000000);
      expect(parseMoneyInput('1\u00a0500\u00a0000')).toBe(1500000);
      expect(parseMoneyInput('250,5')).toBe(250.5);
    });

    it('returns null on invalid input or negative numbers', () => {
      expect(parseMoneyInput('abc')).toBeNull();
      expect(parseMoneyInput('-100')).toBeNull();
      expect(parseMoneyInput('')).toBeNull();
      expect(parseMoneyInput(null)).toBeNull();
    });

    it('handles allowZero option correctly', () => {
      expect(parseMoneyInput('0')).toBeNull();
      expect(parseMoneyInput('0', { allowZero: true })).toBe(0);
      expect(parseMoneyInput('', { allowZero: true })).toBe(0);
    });
  });

  describe('formatMoneyInputDigits', () => {
    it('strips all non-digit characters and formats with spaces', () => {
      expect(formatMoneyInputDigits('1000000')).toBe('1 000 000');
      expect(formatMoneyInputDigits('dsacds')).toBe('');
      expect(formatMoneyInputDigits('12a34b56')).toBe('123 456');
      expect(formatMoneyInputDigits('50000')).toBe('50 000');
    });

    it('normalizes leading zeros', () => {
      expect(formatMoneyInputDigits('0')).toBe('0');
      expect(formatMoneyInputDigits('00')).toBe('0');
      expect(formatMoneyInputDigits('05')).toBe('5');
      expect(formatMoneyInputDigits('00100')).toBe('100');
    });

    it('handles empty, null and undefined safely', () => {
      expect(formatMoneyInputDigits('')).toBe('');
      expect(formatMoneyInputDigits(null)).toBe('');
      expect(formatMoneyInputDigits(undefined)).toBe('');
    });
  });

  describe('preventNonNumericKey', () => {
    it('permits digit keys', () => {
      const e = { key: '5', preventDefault: vi.fn() };
      preventNonNumericKey(e);
      expect(e.preventDefault).not.toHaveBeenCalled();
    });

    it('permits control and navigation keys', () => {
      ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter', 'Unidentified'].forEach((key) => {
        const e = { key, preventDefault: vi.fn() };
        preventNonNumericKey(e);
        expect(e.preventDefault).not.toHaveBeenCalled();
      });
    });

    it('permits keyboard shortcuts with ctrl/meta', () => {
      const e = { key: 'v', ctrlKey: true, preventDefault: vi.fn() };
      preventNonNumericKey(e);
      expect(e.preventDefault).not.toHaveBeenCalled();
    });

    it('blocks letters and symbols', () => {
      ['a', 'z', 'd', 's', '!', '@', '#', ' ', '-', '+'].forEach((key) => {
        const e = { key, preventDefault: vi.fn() };
        preventNonNumericKey(e);
        expect(e.preventDefault).toHaveBeenCalled();
      });
    });
  });
});

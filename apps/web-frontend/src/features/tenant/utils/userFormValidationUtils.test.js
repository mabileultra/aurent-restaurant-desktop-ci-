import { describe, expect, it } from 'vitest';
import {
  isValidAdminPassword,
  getAdminPasswordError,
  isWeakPin,
  getPinValidationError,
  isValidEmail,
  sanitizeUserDisplayName,
} from './userFormValidationUtils';

describe('userFormValidationUtils', () => {
  describe('isValidAdminPassword and getAdminPasswordError', () => {
    it('rejects short passwords and missing characters', () => {
      expect(isValidAdminPassword('123456')).toBe(false);
      expect(getAdminPasswordError('123456')).toBe(
        'Parol kamida 8 ta belgidan iborat bo‘lib, harf va raqam qatnashishi shart'
      );
      expect(isValidAdminPassword('abcdefgh')).toBe(false);
      expect(isValidAdminPassword('12345678')).toBe(false);
      expect(getAdminPasswordError('')).toBe('Parol kiritilishi shart');
    });

    it('accepts strong passwords containing letters and digits with at least 8 chars', () => {
      expect(isValidAdminPassword('Admin123')).toBe(true);
      expect(isValidAdminPassword('pass12345')).toBe(true);
      expect(getAdminPasswordError('Admin123')).toBeNull();
    });
  });

  describe('isWeakPin and getPinValidationError', () => {
    it('detects sequential and repetitive PINs as weak (4-6 digits)', () => {
      expect(isWeakPin('0000')).toBe(true);
      expect(isWeakPin('1111')).toBe(true);
      expect(isWeakPin('00000')).toBe(true);
      expect(isWeakPin('111111')).toBe(true);
      expect(isWeakPin('1234')).toBe(true);
      expect(isWeakPin('12345')).toBe(true);
      expect(isWeakPin('123456')).toBe(true);
      expect(isWeakPin('4321')).toBe(true);
      expect(isWeakPin('654321')).toBe(true);
      expect(isWeakPin('2580')).toBe(true);
      expect(getPinValidationError('123456')).toBe(
        'Juda oddiy PIN-kod (masalan 1234 yoki 0000). Xavfsizroq PIN kiriting'
      );
    });

    it('rejects invalid pin formats', () => {
      expect(getPinValidationError('')).toBe('PIN-kod kiritilishi shart');
      expect(getPinValidationError('123')).toBe('PIN-kod 4 dan 6 tagacha raqamdan iborat bo‘lishi kerak');
      expect(getPinValidationError('1234567')).toBe('PIN-kod 4 dan 6 tagacha raqamdan iborat bo‘lishi kerak');
      expect(getPinValidationError('abcd')).toBe('PIN-kod 4 dan 6 tagacha raqamdan iborat bo‘lishi kerak');
    });

    it('accepts valid random non-trivial 4-6 digit PINs', () => {
      expect(isWeakPin('8492')).toBe(false);
      expect(isWeakPin('39518')).toBe(false);
      expect(isWeakPin('739184')).toBe(false);
      expect(getPinValidationError('8492')).toBeNull();
      expect(getPinValidationError('739184')).toBeNull();
    });
  });

  describe('isValidEmail', () => {
    it('validates email formats', () => {
      expect(isValidEmail('admin@pos.uz')).toBe(true);
      expect(isValidEmail('invalid-email')).toBe(false);
      expect(isValidEmail('test@domain')).toBe(false);
      expect(isValidEmail('')).toBe(false);
    });
  });

  describe('sanitizeUserDisplayName', () => {
    it('strips leading dashes and spaces', () => {
      expect(sanitizeUserDisplayName('— TEST Claude Sinov', 'claudesinov')).toBe('TEST Claude Sinov');
      expect(sanitizeUserDisplayName('- Admin Foydalanuvchi', 'admin')).toBe('Admin Foydalanuvchi');
    });

    it('falls back to username if name is only dashes or empty', () => {
      expect(sanitizeUserDisplayName('—', 'admin_1')).toBe('admin_1');
      expect(sanitizeUserDisplayName('— —', 'kassir3')).toBe('kassir3');
      expect(sanitizeUserDisplayName('', 'user99')).toBe('user99');
    });
  });
});

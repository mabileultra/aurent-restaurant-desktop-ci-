import { describe, expect, it } from 'vitest';
import {
  generateSecurePassword,
  formatSecurityDate,
  calculateDaysAgo,
  evaluatePasswordStrength,
  resolveAttemptBadge,
  resolveUserInitials,
} from './securityFormatUtils';

describe('securityFormatUtils', () => {
  it('generates secure random password of specified length', () => {
    const pwd1 = generateSecurePassword(12);
    const pwd2 = generateSecurePassword(12);
    expect(pwd1).toHaveLength(12);
    expect(pwd2).toHaveLength(12);
    expect(pwd1).not.toBe(pwd2);
  });

  it('formats security dates correctly', () => {
    expect(formatSecurityDate('')).toBe('');
    const formatted = formatSecurityDate('2026-09-24T09:39:25.981382Z', 'uz');
    expect(formatted).toContain('2026');
    expect(formatted).toContain('24');
  });

  it('calculates days ago properly', () => {
    expect(calculateDaysAgo('')).toBeNull();
    const tenDaysAgo = new Date(Date.now() - 10 * 86400000).toISOString();
    expect(calculateDaysAgo(tenDaysAgo)).toBe(10);
  });

  it('evaluates password strength correctly', () => {
    expect(evaluatePasswordStrength('').score).toBe(0);
    expect(evaluatePasswordStrength('short').score).toBe(0);
    expect(evaluatePasswordStrength('Password123').score).toBe(2);
    const strong = evaluatePasswordStrength('Password123!');
    expect(strong.score).toBe(4);
    expect(strong.label).toBe('Kuchli');
  });

  it('resolves user initials properly', () => {
    expect(resolveUserInitials('Dilnoza', 'Karimova')).toBe('DK');
    expect(resolveUserInitials('Super', '')).toBe('S');
    expect(resolveUserInitials('', '')).toBe('U');
  });

  it('resolves attempt badges correctly', () => {
    expect(resolveAttemptBadge('ok').label).toBe('Muvaffaqiyatli');
    expect(resolveAttemptBadge('fail').label).toBe('Noto‘g‘ri parol');
    expect(resolveAttemptBadge('blocked').label).toBe('Bloklandi');
    expect(resolveAttemptBadge('unknown').label).toBe('Login topilmadi');
  });
});

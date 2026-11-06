import { describe, it, expect } from 'vitest';
import { generateSecurePassword } from './passwordGenerator';

describe('generateSecurePassword', () => {
  it('generates a password of at least default length (12)', () => {
    const pwd = generateSecurePassword();
    expect(pwd.length).toBeGreaterThanOrEqual(12);
  });

  it('generates requested custom length when >= 12', () => {
    const pwd = generateSecurePassword(16);
    expect(pwd.length).toBe(16);
  });

  it('enforces minimum length of 12 even when smaller requested', () => {
    const pwd = generateSecurePassword(6);
    expect(pwd.length).toBe(12);
  });

  it('contains uppercase, lowercase, digit, and symbol', () => {
    for (let i = 0; i < 20; i++) {
      const pwd = generateSecurePassword(12);
      expect(/[A-Z]/.test(pwd)).toBe(true);
      expect(/[a-z]/.test(pwd)).toBe(true);
      expect(/[0-9]/.test(pwd)).toBe(true);
      expect(/[!@#$%&*]/.test(pwd)).toBe(true);
    }
  });

  it('generates distinct random passwords on consecutive calls', () => {
    const p1 = generateSecurePassword();
    const p2 = generateSecurePassword();
    expect(p1).not.toBe(p2);
  });
});

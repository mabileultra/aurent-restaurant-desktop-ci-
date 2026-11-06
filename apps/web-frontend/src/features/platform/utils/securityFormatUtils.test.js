import { describe, expect, it } from 'vitest';
import {
  evaluatePasswordStrength,
  resolveAttemptBadge,
  resolveUserInitials,
} from './securityFormatUtils';

describe('securityFormatUtils', () => {
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

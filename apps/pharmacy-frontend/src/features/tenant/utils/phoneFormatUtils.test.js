import { describe, expect, it } from 'vitest';
import { formatUzbekPhone, normalizePhoneToE164 } from './phoneFormatUtils';

describe('phoneFormatUtils', () => {
  it('formats raw digits to Uzbek phone pattern', () => {
    expect(formatUzbekPhone('901234567')).toBe('+998 (90) 123-45-67');
    expect(formatUzbekPhone('+998901234567')).toBe('+998 (90) 123-45-67');
    expect(formatUzbekPhone('+99')).toBe('+99');
    expect(formatUzbekPhone('+9')).toBe('+9');
    expect(formatUzbekPhone('')).toBe('');
  });

  it('normalizes to E.164 format', () => {
    expect(normalizePhoneToE164('901234567')).toBe('+998901234567');
    expect(normalizePhoneToE164('+998 (90) 123-45-67')).toBe('+998901234567');
    expect(normalizePhoneToE164('+998')).toBe('');
    expect(normalizePhoneToE164('')).toBe('');
  });
});

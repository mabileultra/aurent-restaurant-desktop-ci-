import { describe, expect, it } from 'vitest';
import { isForbiddenMxik, normalizeMxik, FORBIDDEN_MXIK_CODES } from './forbiddenMxik';

describe('forbiddenMxik', () => {
  it('flags each blocked code', () => {
    for (const code of FORBIDDEN_MXIK_CODES) {
      expect(isForbiddenMxik(code)).toBe(true);
      expect(isForbiddenMxik(` ${code} `)).toBe(true);
    }
  });

  it('allows normal ikpu', () => {
    expect(isForbiddenMxik('03004409005039001')).toBe(false);
    expect(isForbiddenMxik('')).toBe(false);
    expect(isForbiddenMxik(null)).toBe(false);
  });

  it('normalizes digits only', () => {
    expect(normalizeMxik('IKPU-06302001004033010')).toBe('06302001004033010');
  });
});

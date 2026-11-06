import { describe, expect, it } from 'vitest';
import {
  buildHandoffAcceptUrl,
  HANDOFF_AUDIENCE,
  safeNextPath,
  readHandoffCodeFromSearch,
} from './index.js';

describe('@aurent/shared-auth', () => {
  it('exports pharmacy audience', () => {
    expect(HANDOFF_AUDIENCE.PHARMACY).toBe('PHARMACY');
  });

  it('safeNextPath blocks open redirects', () => {
    expect(safeNextPath('/pos')).toBe('/pos');
    expect(safeNextPath('//evil')).toBe('');
    expect(safeNextPath('https://evil')).toBe('');
  });

  it('buildHandoffAcceptUrl puts code not jwt', () => {
    const url = buildHandoffAcceptUrl('https://p-aurent.uz', { code: 'abc', next: '/pos' });
    expect(url).toBe('https://p-aurent.uz/auth/accept?code=abc&next=%2Fpos');
  });

  it('readHandoffCodeFromSearch', () => {
    const sp = new URLSearchParams('code=xyz&next=/pos');
    expect(readHandoffCodeFromSearch(sp)).toBe('xyz');
  });
});

import { describe, expect, it } from 'vitest';
import { cleanGeoName } from './geoNameUtils';

describe('cleanGeoName', () => {
  it('cleans escaped double apostrophes in Uzbek region and district names', () => {
    expect(cleanGeoName("Qoraqalpog''iston Respublikasi")).toBe('Qoraqalpog‘iston Respublikasi');
    expect(cleanGeoName("Bulung''ur t.")).toBe('Bulung‘ur t.');
    expect(cleanGeoName("Farg''ona viloyati")).toBe('Farg‘ona viloyati');
    expect(cleanGeoName("Kattaqo''rg''on sh.")).toBe('Kattaqo‘rg‘on sh.');
  });

  it('replaces backticks with proper Uzbek apostrophe', () => {
    expect(cleanGeoName('Farg`ona viloyati')).toBe('Farg‘ona viloyati');
  });

  it('leaves already clean names intact', () => {
    expect(cleanGeoName('Samarqand viloyati')).toBe('Samarqand viloyati');
    expect(cleanGeoName('Toshkent shahri')).toBe('Toshkent shahri');
  });

  it('handles null, undefined and empty values safely', () => {
    expect(cleanGeoName(null)).toBe('');
    expect(cleanGeoName(undefined)).toBe('');
    expect(cleanGeoName('')).toBe('');
  });
});

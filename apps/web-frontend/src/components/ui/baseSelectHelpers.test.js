import { describe, expect, it } from 'vitest';
import { filterVisibleOptions, optionSearchText, toOptionValue } from './baseSelectHelpers';

describe('baseSelectHelpers', () => {
  it('normalizes toOptionValue correctly', () => {
    expect(toOptionValue(null)).toBe('');
    expect(toOptionValue(undefined)).toBe('');
    expect(toOptionValue(123)).toBe('123');
    expect(toOptionValue('abc')).toBe('abc');
  });

  it('extracts optionSearchText in lowercase', () => {
    const text = optionSearchText({ label: 'Olma', value: 'apple', keywords: ['meva', 'fruit'] });
    expect(text).toContain('olma');
    expect(text).toContain('apple');
    expect(text).toContain('meva');
    expect(text).toContain('fruit');
  });

  it('filters visible options ignoring empty option', () => {
    const options = [
      { label: 'Barchasi', value: '' },
      { label: 'Olma', value: 'apple' },
      { label: 'Banan', value: 'banana' },
    ];
    const filtered = filterVisibleOptions(options, 'ban');
    expect(filtered).toHaveLength(1);
    expect(filtered[0].value).toBe('banana');
  });
});

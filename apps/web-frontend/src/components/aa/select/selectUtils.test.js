import { describe, it, expect } from 'vitest';
import {
  normalizeSearchText,
  filterSelectOptions,
  findNextEnabledIndex,
  findOptionStartingWith,
} from './selectUtils';

describe('selectUtils', () => {
  it('normalizes single quotes and converts to lowercase', () => {
    expect(normalizeSearchText('Farg‘ona')).toBe("farg'ona");
    expect(normalizeSearchText('Bog’ot')).toBe("bog'ot");
    expect(normalizeSearchText('Qoraqalpog`iston')).toBe("qoraqalpog'iston");
    expect(normalizeSearchText(null)).toBe('');
  });

  it('filters options with apostrophe tolerance', () => {
    const options = [
      { value: 'fer', label: 'Farg‘ona viloyati' },
      { value: 'tas', label: 'Toshkent shahri' },
      { value: 'bog', label: 'Bog‘ot tumani' },
    ];

    expect(filterSelectOptions(options, "farg'ona")).toEqual([
      { value: 'fer', label: 'Farg‘ona viloyati' },
    ]);
    expect(filterSelectOptions(options, "bog'ot")).toEqual([
      { value: 'bog', label: 'Bog‘ot tumani' },
    ]);
    expect(filterSelectOptions(options, '')).toEqual(options);
  });

  it('skips disabled options when navigating', () => {
    const options = [
      { value: '1', label: 'One' },
      { value: '2', label: 'Two', disabled: true },
      { value: '3', label: 'Three' },
    ];

    expect(findNextEnabledIndex(options, 0, 1)).toBe(2);
    expect(findNextEnabledIndex(options, 2, -1)).toBe(0);
    expect(findNextEnabledIndex(options, 2, 1)).toBe(2);
  });

  it('finds option starting with character', () => {
    const options = [
      { value: '1', label: 'Andijon' },
      { value: '2', label: 'Buxoro' },
      { value: '3', label: 'Samarqand' },
    ];

    expect(findOptionStartingWith(options, 'b')).toBe(1);
    expect(findOptionStartingWith(options, 's')).toBe(2);
    expect(findOptionStartingWith(options, 'z')).toBe(-1);
  });
});

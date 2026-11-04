import { describe, expect, it } from 'vitest';
import {
  formatIsoToDisplay,
  parseSmartExpiryInput,
} from './smartExpiryInput';

const JUNE_2023 = new Date(2023, 5, 15);
const SEP_2026 = new Date(2026, 8, 15);

describe('parseSmartExpiryInput', () => {
  it('parses typed dates into ISO', () => {
    expect(parseSmartExpiryInput('12', JUNE_2023)).toBe('2023-12-01');
    expect(parseSmartExpiryInput('2050', JUNE_2023)).toBe('2050-01-01');
    expect(parseSmartExpiryInput('1250', JUNE_2023)).toBe('2050-12-01');
    expect(parseSmartExpiryInput('311250', JUNE_2023)).toBe('2050-12-31');
    expect(parseSmartExpiryInput('31122050', JUNE_2023)).toBe('2050-12-31');
    expect(parseSmartExpiryInput('06.2050', JUNE_2023)).toBe('2050-06-01');
    expect(parseSmartExpiryInput('12.50', JUNE_2023)).toBe('2050-12-01');
    expect(parseSmartExpiryInput('2050/02/10', JUNE_2023)).toBe('2050-02-10');
    expect(parseSmartExpiryInput('01.02.2050', JUNE_2023)).toBe('2050-02-01');
    expect(parseSmartExpiryInput('01.02.50', JUNE_2023)).toBe('2050-02-01');
    expect(parseSmartExpiryInput('фев 50', JUNE_2023)).toBe('2050-02-01');
    expect(parseSmartExpiryInput('Октябрь 50', JUNE_2023)).toBe('2050-10-01');
    expect(parseSmartExpiryInput('0525', JUNE_2023)).toBe('2025-05-01');
    expect(parseSmartExpiryInput('15.09.2027', JUNE_2023)).toBe('2027-09-15');
  });

  it('uses next year when the month already passed', () => {
    expect(parseSmartExpiryInput('12', SEP_2026)).toBe('2026-12-01');
    expect(parseSmartExpiryInput('08', SEP_2026)).toBe('2027-08-01');
    expect(parseSmartExpiryInput('09', SEP_2026)).toBe('2026-09-01');
  });
});

describe('formatIsoToDisplay', () => {
  it('formats ISO as dd.MM.yyyy', () => {
    expect(formatIsoToDisplay('2027-09-15')).toBe('15.09.2027');
  });
});

import { describe, expect, it } from 'vitest';
import {
  formatMarkedLabel,
  formatUnitsInPackCell,
  productIkpu,
  productIsMarked,
  productPackageCode,
} from './pharmacyProductFiscalMeta';

describe('pharmacyProductFiscalMeta', () => {
  it('reads ikpu and package code', () => {
    expect(productIkpu({ ikpu: ' 123 ' })).toBe('123');
    expect(productPackageCode({ packageCode: '1546940' })).toBe('1546940');
  });

  it('detects marking flag', () => {
    expect(productIsMarked({ markedProduct: true })).toBe(true);
    expect(productIsMarked({ markedProduct: false })).toBe(false);
    expect(formatMarkedLabel({ markedProduct: true }, 'Да', 'Нет')).toBe('Да');
  });

  it('formats units in pack', () => {
    expect(formatUnitsInPackCell({ attributes: { units_in_pack: '10' } })).toBe('10');
    expect(formatUnitsInPackCell({})).toBe('');
  });
});

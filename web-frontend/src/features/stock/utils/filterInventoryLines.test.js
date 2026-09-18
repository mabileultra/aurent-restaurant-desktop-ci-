import { describe, expect, it } from 'vitest';
import { filterInventoryLines } from './filterInventoryLines';

describe('filterInventoryLines', () => {
  const lines = [
    { productId: '1', product: { name: 'Аспирин', sku: 'A-1', barcode: '460001' } },
    { productId: '2', product: { name: 'Йод', sku: 'B-2', barcode: '460002' } },
    { productId: '', product: null },
  ];

  it('keeps empty lines and matches name or barcode', () => {
    const byName = filterInventoryLines(lines, 'аспи');
    expect(byName.map((row) => row.index)).toEqual([0, 2]);

    const byCode = filterInventoryLines(lines, '460002');
    expect(byCode.map((row) => row.index)).toEqual([1, 2]);
  });

  it('returns every line when filter is blank', () => {
    expect(filterInventoryLines(lines, '  ').map((row) => row.index)).toEqual([0, 1, 2]);
  });
});

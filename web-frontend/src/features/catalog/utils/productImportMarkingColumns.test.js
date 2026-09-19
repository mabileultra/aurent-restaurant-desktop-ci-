import { describe, expect, it } from 'vitest';
import { countProductImportMarked } from './countProductImportMarked';
import {
  PRODUCT_IMPORT_COLUMN_DEFS,
  defaultProductImportColumnVisibility,
} from './productImportColumns';

describe('countProductImportMarked', () => {
  it('считает editable.markedProduct=true', () => {
    const rows = [
      { rowNum: 1, status: 'NEW' },
      { rowNum: 2, status: 'NEW' },
      { rowNum: 3, status: 'DUPLICATE' },
    ];
    const editable = {
      1: { markedProduct: true },
      2: { markedProduct: false },
    };
    expect(countProductImportMarked(rows, editable, {})).toBe(1);
  });

  it('если editable не задан — берёт из tasnif', () => {
    const rows = [{ rowNum: 1, status: 'NEW' }];
    expect(
      countProductImportMarked(rows, {}, { 1: { markedProduct: true } })
    ).toBe(1);
  });

  it('ручной false перекрывает tasnif true', () => {
    const rows = [{ rowNum: 1, status: 'NEW' }];
    expect(
      countProductImportMarked(
        rows,
        { 1: { markedProduct: false } },
        { 1: { markedProduct: true } }
      )
    ).toBe(0);
  });
});

describe('productImportColumns', () => {
  it('есть колонки тасниф, штрихкод, маркировка', () => {
    const ids = PRODUCT_IMPORT_COLUMN_DEFS.map((c) => c.id);
    expect(ids).toContain('tasnif');
    expect(ids).toContain('barcode');
    expect(ids).toContain('marking');
    expect(ids).toContain('ikpu');
  });

  it('дефолтная видимость включает маркировку и тасниф', () => {
    const vis = defaultProductImportColumnVisibility();
    expect(vis.tasnif).toBe(true);
    expect(vis.marking).toBe(true);
    expect(vis.barcode).toBe(true);
    expect(vis.rowNum).toBe(true);
  });
});

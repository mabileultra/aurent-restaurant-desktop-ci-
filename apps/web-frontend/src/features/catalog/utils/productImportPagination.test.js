import { describe, expect, it } from 'vitest';
import {
  clampImportPage,
  importTotalPages,
  sliceImportPage,
  PRODUCT_IMPORT_DEFAULT_PAGE_SIZE,
} from './productImportPagination';

describe('productImportPagination', () => {
  it('defaults to 10 per page', () => {
    expect(PRODUCT_IMPORT_DEFAULT_PAGE_SIZE).toBe(10);
    expect(importTotalPages(25, 10)).toBe(3);
    expect(importTotalPages(25, 20)).toBe(2);
  });

  it('slices page rows', () => {
    const rows = Array.from({ length: 25 }, (_, i) => ({ rowNum: i + 1 }));
    const first = sliceImportPage(rows, 1, 10);
    expect(first.pageRows).toHaveLength(10);
    expect(first.pageRows[0].rowNum).toBe(1);
    expect(first.from).toBe(1);
    expect(first.to).toBe(10);

    const last = sliceImportPage(rows, 3, 10);
    expect(last.pageRows).toHaveLength(5);
    expect(last.from).toBe(21);
    expect(last.to).toBe(25);
  });

  it('clamps page into range', () => {
    expect(clampImportPage(0, 3)).toBe(1);
    expect(clampImportPage(99, 3)).toBe(3);
  });
});

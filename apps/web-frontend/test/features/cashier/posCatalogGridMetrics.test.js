import { describe, expect, it } from 'vitest';
import {
  estimatePosCatalogColumns,
  posCatalogColumnCount,
  posCatalogRowHeight,
} from '../../../src/features/cashier/utils/posCatalogGridMetrics';

describe('posCatalogGridMetrics', () => {
  it('estimates at least one column', () => {
    expect(estimatePosCatalogColumns(0)).toBe(1);
    expect(estimatePosCatalogColumns(100)).toBeGreaterThanOrEqual(1);
  });

  it('grows columns with wider panels', () => {
    expect(estimatePosCatalogColumns(900)).toBeGreaterThan(estimatePosCatalogColumns(300));
  });

  it('list mode is always one column', () => {
    expect(posCatalogColumnCount('list', 900)).toBe(1);
    expect(posCatalogColumnCount('grid', 900)).toBeGreaterThan(1);
  });

  it('list rows are shorter than grid cards', () => {
    expect(posCatalogRowHeight('list')).toBeLessThan(posCatalogRowHeight('grid'));
  });
});

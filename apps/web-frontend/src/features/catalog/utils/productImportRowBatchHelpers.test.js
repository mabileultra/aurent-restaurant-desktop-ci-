import { describe, expect, it } from 'vitest';
import {
  applyFieldToAllRows,
  applyMarkupToRows,
} from './productImportRowBatchHelpers';

describe('productImportRowBatchHelpers', () => {
  describe('applyMarkupToRows', () => {
    it('applies markup correctly to new rows', () => {
      const prevEditable = {
        1: { importPrice: 100 },
        2: { importPrice: 200 },
      };
      const rows = [
        { rowNum: 1, fileSellingPrice: 100, status: 'NEW' },
        { rowNum: 2, fileSellingPrice: 200, status: 'DUPLICATE' },
      ];

      const result = applyMarkupToRows(prevEditable, rows, 20);
      expect(result[1].importPrice).toBe(120);
      expect(result[2].importPrice).toBe(200); // not updated because not new
    });
  });

  describe('applyFieldToAllRows', () => {
    it('updates specified field across all rows', () => {
      const prevEditable = {
        1: { categoryId: 10 },
        2: { categoryId: 20 },
      };

      const result = applyFieldToAllRows(prevEditable, 'categoryId', 99);
      expect(result[1].categoryId).toBe(99);
      expect(result[2].categoryId).toBe(99);
    });
  });
});

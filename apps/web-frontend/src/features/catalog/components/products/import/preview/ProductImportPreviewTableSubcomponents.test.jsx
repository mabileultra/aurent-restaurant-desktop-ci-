// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import ProductImportPreviewCell, { formatQty } from './ProductImportPreviewCell';
import ProductImportPreviewTableRow, { cellAlignClass } from './ProductImportPreviewTableRow';

afterEach(cleanup);

describe('ProductImportPreview subcomponents', () => {
  const mockT = (key) => key;

  describe('formatQty & cellAlignClass', () => {
    it('formatQty formats number strings or returns dash', () => {
      expect(formatQty(10)).toBe('10');
      expect(formatQty('5.5')).toBe('5.5');
      expect(formatQty(null)).toBe('—');
      expect(formatQty('')).toBe('—');
    });

    it('cellAlignClass aligns price and qty to right', () => {
      expect(cellAlignClass('filePrice')).toBe('text-right');
      expect(cellAlignClass('qty')).toBe('text-right');
      expect(cellAlignClass('name')).toBeUndefined();
    });
  });

  describe('ProductImportPreviewCell', () => {
    it('renders text cells like unit and vat', () => {
      const row = {
        rowNum: 1,
        unitOfMeasure: 'pcs',
        taxRatePercent: 12,
      };

      render(
        <ProductImportPreviewCell
          colId="unit"
          t={mockT}
          r={row}
        />
      );
      expect(screen.getByText('pcs')).toBeDefined();
    });

    it('renders rowNum', () => {
      const row = { rowNum: 42 };
      render(
        <ProductImportPreviewCell
          colId="rowNum"
          t={mockT}
          r={row}
        />
      );
      expect(screen.getByText('42')).toBeDefined();
    });
  });

  describe('ProductImportPreviewTableRow', () => {
    it('renders tr with columns', () => {
      const row = { rowNum: 1, unitOfMeasure: 'kg' };
      const cols = [{ id: 'unit', labelKey: 'Unit' }];

      render(
        <table>
          <tbody>
            <ProductImportPreviewTableRow
              row={row}
              cols={cols}
              ed={null}
              tasnif={null}
              t={mockT}
              categories={[]}
              stores={[]}
            />
          </tbody>
        </table>
      );

      expect(screen.getByText('kg')).toBeDefined();
    });
  });
});

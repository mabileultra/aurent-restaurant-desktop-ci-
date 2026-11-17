import { describe, it, expect, vi } from 'vitest';
import {
  buildReturnsQueryParams,
  buildReturnsExportParams,
  enrichReturnsRowsWithStores,
  formatReturnDateTime,
  exportReturnsExcelFile,
} from './returnsPageHelpers';

describe('returnsPageHelpers', () => {
  it('buildReturnsQueryParams maps filters correctly', () => {
    const applied = {
      dateFrom: '2026-02-01',
      dateTo: '2026-02-15',
      cashierName: '  Bob  ',
      storeId: '3',
    };
    const params = buildReturnsQueryParams(applied, { page: 1, pageSize: 25, search: ' F123 ' });
    expect(params).toEqual({
      page: 1,
      size: 25,
      fiscalSearch: 'F123',
      from: '2026-02-01',
      to: '2026-02-15',
      cashierName: 'Bob',
      storeId: 3,
    });
  });

  it('buildReturnsExportParams cleans empty strings', () => {
    const applied = {
      dateFrom: '',
      dateTo: '',
      cashierName: '   ',
      storeId: '',
    };
    const params = buildReturnsExportParams(applied, '   ');
    expect(params).toEqual({
      fiscalSearch: undefined,
      from: undefined,
      to: undefined,
      cashierName: undefined,
      storeId: undefined,
    });
  });

  it('enrichReturnsRowsWithStores attaches storeName', () => {
    const stores = [{ id: 5, name: 'Warehouse Store' }];
    const rows = [
      { id: 1, storeId: 5 },
      { id: 2, storeId: 99 },
    ];
    const enriched = enrichReturnsRowsWithStores(rows, stores);
    expect(enriched[0].storeName).toBe('Warehouse Store');
    expect(enriched[1].storeName).toBeUndefined();
  });

  it('formatReturnDateTime formats ISO dates properly', () => {
    expect(formatReturnDateTime('2026-11-16T15:45:00.000Z')).toContain('2026');
    expect(formatReturnDateTime(null)).toBe('—');
    expect(formatReturnDateTime('bad-date')).toBe('—');
  });

  it('exportReturnsExcelFile blocks pharmacy with toast', async () => {
    const toast = { error: vi.fn(), success: vi.fn() };
    const t = vi.fn((k, opt) => opt?.defaultValue || k);
    await exportReturnsExcelFile({}, { isPharmacy: true, t, toast, setExporting: vi.fn() });
    expect(toast.error).toHaveBeenCalled();
  });
});

import { describe, it, expect } from 'vitest';
import {
  buildSalesQueryParams,
  buildSalesExportParams,
  enrichSalesRowsWithStores,
  formatSaleDateTime,
} from './salesLedgerHelpers';

describe('salesLedgerHelpers', () => {
  it('buildSalesQueryParams correctly maps filters and pagination', () => {
    const applied = {
      dateFrom: '2026-01-01',
      dateTo: '2026-01-02',
      receiptNumber: '  REC123  ',
      saleId: ' 45 ',
      cashierName: '  Ali  ',
      paymentMethod: 'CASH',
      paymentSettlement: 'ALL',
      storeId: '5',
    };
    const params = buildSalesQueryParams(applied, { page: 2, pageSize: 50, search: ' test ' });
    expect(params).toEqual({
      page: 2,
      size: 50,
      search: 'test',
      from: '2026-01-01',
      to: '2026-01-02',
      receiptNumber: 'REC123',
      saleId: '45',
      cashierName: 'Ali',
      paymentMethod: 'CASH',
      paymentSettlement: undefined,
      storeId: 5,
    });
  });

  it('buildSalesExportParams cleans empty strings and ignores pagination', () => {
    const applied = {
      dateFrom: '',
      dateTo: '',
      receiptNumber: '   ',
      saleId: '',
      cashierName: '',
      paymentMethod: '',
      paymentSettlement: 'ALL',
      storeId: '',
    };
    const params = buildSalesExportParams(applied, '   ');
    expect(params).toEqual({
      search: undefined,
      from: undefined,
      to: undefined,
      receiptNumber: undefined,
      saleId: undefined,
      cashierName: undefined,
      paymentMethod: undefined,
      paymentSettlement: undefined,
      storeId: undefined,
    });
  });

  it('enrichSalesRowsWithStores attaches storeName if not present', () => {
    const stores = [
      { id: 1, name: 'Main Store' },
      { id: 2, name: 'Branch 2' },
    ];
    const rows = [
      { id: 10, storeId: 1 },
      { id: 11, storeId: 2, storeName: 'Custom Store' },
      { id: 12, storeId: 99 },
    ];
    const enriched = enrichSalesRowsWithStores(rows, stores);
    expect(enriched[0].storeName).toBe('Main Store');
    expect(enriched[1].storeName).toBe('Custom Store');
    expect(enriched[2].storeName).toBeUndefined();
  });

  it('formatSaleDateTime formats valid ISO strings and returns dash on error', () => {
    expect(formatSaleDateTime('2026-11-16T10:30:00.000Z')).toContain('2026-11-16');
    expect(formatSaleDateTime(null)).toBe('—');
    expect(formatSaleDateTime('invalid-date')).toBe('—');
  });
});

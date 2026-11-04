import { describe, expect, it, vi } from 'vitest';
import { runPharmacyImportMatchChunks } from './runPharmacyImportMatchChunks';

describe('runPharmacyImportMatchChunks', () => {
  it('splits rows and keeps global offsets', async () => {
    const rows = Array.from({ length: 250 }, (_, i) => [`row-${i}`]);
    const calls = [];
    const matchRequest = vi.fn(async (body) => {
      calls.push(body);
      return {
        uzInvoiceDocumentId: 'INV-1',
        invoiceAlreadyImported: false,
        items: body.rows.map((_, i) => ({ rowIndex: body.rowOffset + i, excelName: `n${body.rowOffset + i}` })),
      };
    });

    const result = await runPharmacyImportMatchChunks({
      rows,
      roles: { NAME: 0 },
      useFinalSums: false,
      invoiceId: null,
      matchRequest,
      chunkSize: 100,
    });

    expect(calls).toHaveLength(3);
    expect(calls[0].rowOffset).toBe(0);
    expect(calls[0].totalRows).toBe(250);
    expect(calls[0].rows).toHaveLength(100);
    expect(calls[1].rowOffset).toBe(100);
    expect(calls[2].rowOffset).toBe(200);
    expect(calls[2].rows).toHaveLength(50);
    expect(result.items).toHaveLength(250);
    expect(result.items[200].rowIndex).toBe(200);
    expect(result.uzInvoiceDocumentId).toBe('INV-1');
  });
});

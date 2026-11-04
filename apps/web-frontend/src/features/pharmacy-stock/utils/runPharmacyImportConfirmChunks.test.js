import { describe, expect, it, vi } from 'vitest';
import { runPharmacyImportConfirmChunks } from './runPharmacyImportConfirmChunks';

describe('runPharmacyImportConfirmChunks', () => {
  it('sends all items in bounded chunks without dropping rows', async () => {
    const calls = [];
    const items = Array.from({ length: 99 }, (_, i) => ({ rowIndex: i }));
    const onChunkSaved = vi.fn();

    const result = await runPharmacyImportConfirmChunks({
      items,
      invoiceId: 'INV-1',
      chunkSize: 80,
      onChunkSaved,
      confirmRequest: async (body) => {
        calls.push(body);
      },
    });

    expect(result.added).toBe(99);
    expect(calls).toHaveLength(2);
    expect(calls[0].items).toHaveLength(80);
    expect(calls[1].items).toHaveLength(19);
    expect(calls[0].uzInvoiceDocumentId).toBe('INV-1');
    expect(onChunkSaved).toHaveBeenCalledTimes(2);
  });
});

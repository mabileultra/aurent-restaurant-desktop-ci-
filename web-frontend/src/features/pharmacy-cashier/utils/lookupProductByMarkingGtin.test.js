import { describe, expect, it, vi } from 'vitest';
import { lookupProductByMarkingGtin } from './lookupProductByMarkingGtin';

const KM = '010478001234567821AbCdEfGhIj';
const product = { id: 11, barcode: '4780012345678', name: 'Чай', ikpu: '03004409005039001' };

describe('lookupProductByMarkingGtin', () => {
  it('finds the product in the loaded list by GTIN from the DataMatrix', async () => {
    const hit = await lookupProductByMarkingGtin({
      products: [product],
      mark: KM,
      fetchByBarcode: vi.fn(),
    });
    expect(hit.id).toBe(11);
  });

  it('searches the catalog by GTIN when the open list is empty', async () => {
    const fetchByBarcode = vi.fn(async () => null);
    const searchCatalog = vi.fn(async (query) => (
      query.includes('4780012345678') ? { content: [product] } : { content: [] }
    ));
    const hit = await lookupProductByMarkingGtin({
      products: [],
      mark: KM,
      fetchByBarcode,
      searchCatalog,
      lookupTasnifByBarcode: vi.fn(),
    });
    expect(hit.id).toBe(11);
    expect(searchCatalog).toHaveBeenCalled();
  });

  it('asks Tasnif immediately and finds the card by IKPU when barcodes do not match', async () => {
    const byIkpu = { id: 22, barcode: '999', ikpu: '03004409005039001', name: 'Чай' };
    const lookupTasnifByBarcode = vi.fn(async () => ({ mxik: '03004409005039001' }));
    const hit = await lookupProductByMarkingGtin({
      products: [byIkpu],
      mark: KM,
      fetchByBarcode: vi.fn(async () => null),
      searchCatalog: vi.fn(async () => ({ content: [] })),
      lookupTasnifByBarcode,
    });
    expect(lookupTasnifByBarcode).toHaveBeenCalled();
    expect(hit.id).toBe(22);
  });

  it('searches the catalog by Tasnif IKPU when the open list has no matching barcode', async () => {
    const byIkpu = { id: 22, barcode: '999', ikpu: '03004409005039001', name: 'Чай' };
    const hit = await lookupProductByMarkingGtin({
      products: [],
      mark: KM,
      fetchByBarcode: vi.fn(async () => null),
      searchCatalog: vi.fn(async (query) => (
        query === '03004409005039001' ? { content: [byIkpu] } : { content: [] }
      )),
      lookupTasnifByBarcode: vi.fn(async () => ({ mxik: '03004409005039001' })),
    });
    expect(hit.id).toBe(22);
  });
});

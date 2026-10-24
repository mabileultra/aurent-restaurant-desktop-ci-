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
    const lookupTasnifByBarcode = vi.fn();
    const searchCatalog = vi.fn(async (query) => (
      query.includes('4780012345678') ? { content: [product] } : { content: [] }
    ));
    const hit = await lookupProductByMarkingGtin({
      products: [],
      mark: KM,
      fetchByBarcode,
      searchCatalog,
      lookupTasnifByBarcode,
    });
    expect(hit.id).toBe(11);
    expect(searchCatalog).toHaveBeenCalled();
    expect(lookupTasnifByBarcode).not.toHaveBeenCalled();
  });

  it('asks Tasnif for IKPU only after GTIN barcode search misses', async () => {
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

  it('tries every GTIN variant in Tasnif then finds the warehouse card by IKPU', async () => {
    const byIkpu = {
      id: 101,
      barcode: '999',
      ikpu: '02208001001926001',
      name: 'Водка: Naleyka, Крепость 40%, Стеклянная бутылка 0,25 л',
    };
    const lookupTasnifByBarcode = vi.fn(async (barcode) => {
      if (barcode === '4780083110808') return { mxik: '02208001001926001', name: byIkpu.name };
      throw new Error('not in tasnif');
    });
    const searchCatalog = vi.fn(async (query) => (
      query === '02208001001926001' ? { content: [byIkpu] } : { content: [] }
    ));
    const hit = await lookupProductByMarkingGtin({
      products: [],
      mark: '0104780083110808217Ф*7щгЮ93Вкф7',
      fetchByBarcode: vi.fn(async () => null),
      searchCatalog,
      lookupTasnifByBarcode,
    });
    expect(hit.id).toBe(101);
    expect(lookupTasnifByBarcode).toHaveBeenCalled();
    expect(searchCatalog).toHaveBeenCalledWith('02208001001926001');
  });

  it('finds a marking-only warehouse card by Tasnif IKPU when GTIN is not on the card', async () => {
    const vodka = {
      id: 77,
      barcode: '999',
      ikpu: '02208001001926001',
      name: 'Водка',
      markedProduct: true,
    };
    const hit = await lookupProductByMarkingGtin({
      products: [vodka],
      mark: '0104780083110808217Ф*7щгЮ93Вкф7',
      fetchByBarcode: vi.fn(async () => null),
      searchCatalog: vi.fn(async () => ({ content: [] })),
      lookupTasnifByBarcode: vi.fn(async () => ({ mxik: '02208001001926001', name: 'Водка' })),
    });
    expect(hit.id).toBe(77);
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

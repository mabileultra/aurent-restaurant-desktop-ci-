import { describe, expect, it, vi } from 'vitest';
import { buildPosCatalogProps } from './posCatalogProps';

describe('posCatalogProps', () => {
  it('correctly maps catalog and cart handlers', () => {
    const catalog = {
      search: 'test',
      setSearch: vi.fn(),
      products: [],
      productsStale: false,
    };
    const cartHandlers = {
      addProductToCart: vi.fn(),
      handleSearchEnter: vi.fn(),
    };
    const options = {
      storeId: 10,
      viewMode: 'grid',
      handleViewModeChange: vi.fn(),
    };

    const props = buildPosCatalogProps(catalog, cartHandlers, options);
    expect(props.storeId).toBe(10);
    expect(props.search).toBe('test');

    props.addProductToCart({ id: 1 });
    expect(cartHandlers.addProductToCart).toHaveBeenCalledWith({ id: 1 });
  });

  it('prevents adding product when catalog is stale', () => {
    const catalog = {
      productsStale: true,
    };
    const cartHandlers = {
      addProductToCart: vi.fn(),
    };
    const props = buildPosCatalogProps(catalog, cartHandlers, { storeId: 1 });
    props.addProductToCart({ id: 1 });
    expect(cartHandlers.addProductToCart).not.toHaveBeenCalled();
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';

const getProduct = vi.fn();

vi.mock('../../../api', () => ({
  pharmacyWarehouseApi: {
    getProduct: (...args) => getProduct(...args),
  },
}));

import { loadCatalogProductDetails } from './usersBarcodePrintUtils';

beforeEach(() => {
  getProduct.mockReset();
});

describe('usersBarcodePrintUtils', () => {
  it('запрашивает карточку препарата через pharmacyWarehouseApi.getProduct', async () => {
    getProduct.mockResolvedValue({
      data: { id: 42, name: 'Парацетамол 500мг', barcode: '4780012345678' },
    });

    const res = await loadCatalogProductDetails({ id: 42, name: 'Парацетамол' });

    expect(getProduct).toHaveBeenCalledWith(42);
    expect(res.name).toBe('Парацетамол 500мг');
  });

  it('возвращает исходный объект при ошибке запроса или отсутствии id', async () => {
    const raw = { id: 99, name: 'Ибупрофен' };
    getProduct.mockRejectedValue(new Error('network error'));

    const res = await loadCatalogProductDetails(raw);

    expect(res).toEqual(raw);
  });
});


import { api } from './client';

export const scalesApi = {
  listWeightProducts: () => api.get('/scales/products'),
  getByPlu: (plu, storeId) =>
    api.get(`/scales/products/plu/${encodeURIComponent(plu)}`, {
      params: storeId != null ? { storeId } : undefined,
    }),
  assignPlu: (productId, plu) =>
    api.put('/scales/products/plu', { productId, plu: plu ?? '' }),
  encodeBarcode: (plu, weightKg) =>
    api.post('/scales/barcode/encode', { plu, weightKg }),
  decodeBarcode: (barcode, storeId) =>
    api.get(`/scales/barcode/decode/${encodeURIComponent(barcode)}`, {
      params: storeId != null ? { storeId } : undefined,
    }),
};

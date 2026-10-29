import { api } from './client';

/** Grocery offline sync (web-backend). */
export const syncApi = {
  bootstrap: (storeId) => api.get('/sync/bootstrap', { params: { storeId } }),
  catalogDelta: (storeId, since) =>
    api.get('/sync/catalog/delta', { params: { storeId, since } }),
  pushSalesBatch: (body) => api.post('/sync/sales/batch', body),
};

/** Pharmacy offline sync (pharmacy-service) — delta not yet available. */
export const pharmacySyncApi = {
  bootstrap: (storeId) => api.get('/pharmacy/sync/bootstrap', { params: { storeId } }),
  pushSalesBatch: (body) => api.post('/pharmacy/sync/sales/batch', body),
};

export function resolveSyncApi(catalogKind) {
  return catalogKind === 'pharmacy' ? pharmacySyncApi : syncApi;
}

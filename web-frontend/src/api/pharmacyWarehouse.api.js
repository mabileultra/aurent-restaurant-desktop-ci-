import { api } from './client';

export const pharmacyWarehouseApi = {
  listReceipts: (params) => api.get('/pharmacy/receipts', { params }),
  getReceipt: (id, config) => api.get(`/pharmacy/receipts/${id}`, config),
  createDraft: (data) => api.post('/pharmacy/receipts', data),
  updateDraft: (id, data) => api.put(`/pharmacy/receipts/${id}`, data),
  deleteDraft: (id) => api.delete(`/pharmacy/receipts/${id}`, { timeout: 180000 }),
  replaceLines: (id, lines) => api.put(`/pharmacy/receipts/${id}/lines`, lines),
  addLine: (id, line) => api.post(`/pharmacy/receipts/${id}/lines`, line),
  updateLine: (id, lineId, line) => api.put(`/pharmacy/receipts/${id}/lines/${lineId}`, line, { timeout: 180000 }),
  massUpdateLines: (id, body) => api.post(`/pharmacy/receipts/${id}/lines/mass`, body, { timeout: 180000 }),
  revalueLines: (id, body) => api.post(`/pharmacy/receipts/${id}/lines/revalue`, body, { timeout: 180000 }),
  removeLine: (id, lineId) => api.delete(`/pharmacy/receipts/${id}/lines/${lineId}`),
  listLots: (params) => api.get('/pharmacy/lots', { params }),
  fefoHints: (params) => api.get('/pharmacy/lots/fefo-hints', { params }),
  listProducts: (params, config) => api.get('/pharmacy/products', { params, ...config }),
  getProduct: (id, params) => api.get(`/pharmacy/products/${id}`, { params }),
  getByBarcode: (barcode, storeId) =>
    api.get(`/pharmacy/products/barcode/${encodeURIComponent(barcode)}`, {
      params: storeId != null ? { storeId } : undefined,
    }),
  createProduct: (data) => api.post('/pharmacy/products', data),
  updateProduct: (id, data) => api.put(`/pharmacy/products/${id}`, data),
  bulkTaxRate: (body) => api.patch('/pharmacy/products/bulk/tax-rate', body),
  deactivate: (id) => api.delete(`/pharmacy/products/${id}`),
  activate: (id) => api.post(`/pharmacy/receipts/${id}/activate`, null, { timeout: 180000 }),
  importParse: (id, file) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.post(`/pharmacy/receipts/${id}/import/parse`, fd, {
      headers: { 'Content-Type': undefined },
      timeout: 180000,
    });
  },
  importMatch: (id, body) => api.post(`/pharmacy/receipts/${id}/import/match`, body, { timeout: 180000 }),
  importConfirm: (id, body) => api.post(`/pharmacy/receipts/${id}/import/confirm`, body, { timeout: 180000 }),
};

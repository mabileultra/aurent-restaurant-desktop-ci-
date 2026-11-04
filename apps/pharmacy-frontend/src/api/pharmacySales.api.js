import { api } from './client';

export const pharmacySalesApi = {
  create: (data, config) => api.post('/pharmacy/sales', data, config),
  getAll: (params) => api.get('/pharmacy/sales', { params }),
  getReturns: (params) => api.get('/pharmacy/sales/returns', { params }),
  getById: (id) => api.get(`/pharmacy/sales/${id}`),
  getReceipt: (receiptNumber) =>
    api.get(`/pharmacy/sales/receipt/${encodeURIComponent(String(receiptNumber).trim())}`),
  mySales: (params) => api.get('/pharmacy/sales/my-sales', { params }),
  checkMarkSold: (payload) => api.post('/pharmacy/sales/marks/check', payload, { timeout: 5000 }),
  void: (id, reason) =>
    api.post(`/pharmacy/sales/${id}/void`, null, { params: reason ? { reason } : undefined }),
  returnItems: (id, body) => api.post(`/pharmacy/sales/${id}/return-items`, body),
};

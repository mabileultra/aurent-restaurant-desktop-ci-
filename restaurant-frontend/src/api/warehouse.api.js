import { api } from './client';

export const warehouseApi = {
  getProducts: (params) => api.get('/warehouse/products', { params }),
  receipt: (data) => api.post('/warehouse/receipt', data),
  createReceipt: (data) => api.post('/warehouse/receipts', data),
  getReceipt: (id) => api.get(`/warehouse/receipts/${id}`),
  listReceipts: (params) => api.get('/warehouse/receipts', { params }),
  createInventory: (data) => api.post('/warehouse/inventories', data),
  getInventory: (id) => api.get(`/warehouse/inventories/${id}`),
  listInventories: (params) => api.get('/warehouse/inventories', { params }),
  createTransfer: (data) => api.post('/warehouse/transfers', data),
  getTransfer: (id) => api.get(`/warehouse/transfers/${id}`),
  listTransfers: (params) => api.get('/warehouse/transfers', { params }),
  createWriteOff: (data) => api.post('/warehouse/write-offs', data),
  createExpense: (data) => api.post('/warehouse/expenses', data),
  getExpense: (id) => api.get(`/warehouse/expenses/${id}`),
  listExpenses: (params) => api.get('/warehouse/expenses', { params }),
  createProduction: (data) => api.post('/warehouse/productions', data),
  getProduction: (id) => api.get(`/warehouse/productions/${id}`),
  listProductions: (params) => api.get('/warehouse/productions', { params }),
};

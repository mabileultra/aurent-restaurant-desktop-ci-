import { api } from './client';

export const stockReportApi = {
  dashboard: (params) => api.get('/reports/stock/dashboard', { params }),
  inventories: (params) => api.get('/reports/stock/inventories', { params }),
  exportInventories: (params) =>
    api.get('/reports/stock/inventories/export', { params, responseType: 'blob' }),
  balances: (params) => api.get('/reports/stock/balances', { params }),
  exportBalances: (params) =>
    api.get('/reports/stock/balances/export', { params, responseType: 'blob' }),
  lowStock: (params) => api.get('/reports/stock/low-stock', { params }),
  receipts: (params) => api.get('/reports/stock/receipts', { params }),
  exportReceipts: (params) =>
    api.get('/reports/stock/receipts/export', { params, responseType: 'blob' }),
  writeOffs: (params) => api.get('/reports/stock/write-offs', { params }),
  movements: (params) => api.get('/reports/stock/movements', { params }),
  transfers: (params) => api.get('/reports/stock/transfers', { params }),
};

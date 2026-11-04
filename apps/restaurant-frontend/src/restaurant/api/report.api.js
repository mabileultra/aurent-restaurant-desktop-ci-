import { api } from '../../api/client';

const rst = (path) => `/rst${path}`;

export const rstReportApi = {
  receipts: (storeId, params = {}) => api.get(rst(`/stores/${storeId}/reports/receipts`), { params }),
  exportReceipts: (storeId, body) =>
    api.post(rst(`/stores/${storeId}/reports/receipts/export`), body, { responseType: 'blob' }),
  salesSummary: (storeId, params = {}) => api.get(rst(`/stores/${storeId}/reports/sales-summary`), { params }),
  dishes: (storeId, params = {}) => api.get(rst(`/stores/${storeId}/reports/dishes`), { params }),
  exportDishes: (storeId, body) =>
    api.post(rst(`/stores/${storeId}/reports/dishes/export`), body, { responseType: 'blob' }),
  shifts: (storeId, params = {}) => api.get(rst(`/stores/${storeId}/reports/shifts`), { params }),
  exportShifts: (storeId, body) =>
    api.post(rst(`/stores/${storeId}/reports/shifts/export`), body, { responseType: 'blob' }),
};

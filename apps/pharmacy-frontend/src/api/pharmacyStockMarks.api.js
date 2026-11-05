import { api } from './client';

export const pharmacyStockMarksApi = {
  check: (payload) => api.post('/pharmacy/stock-marks/check', payload, { timeout: 5000 }),
  list: (params) => api.get('/pharmacy/stock-marks', { params }),
};

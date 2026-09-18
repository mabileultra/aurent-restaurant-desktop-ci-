import { api } from './client';

export const pharmacyStockMarksApi = {
  check: (payload) => api.post('/pharmacy/stock-marks/check', payload, { timeout: 5000 }),
};

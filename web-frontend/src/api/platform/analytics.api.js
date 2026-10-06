import { api } from '../client';

export const platformAnalyticsApi = {
  overview: (params) => api.get('/reports/platform/analytics/overview', { params }),
  stores: (params) => api.get('/reports/platform/analytics/stores', { params }),
  products: (params) => api.get('/reports/platform/analytics/products', { params }),
  sales: (params) => api.get('/reports/platform/analytics/sales', { params }),
  payments: (params) => api.get('/reports/platform/analytics/payments', { params }),
  fiscal: (params) => api.get('/reports/platform/analytics/fiscal', { params }),
};

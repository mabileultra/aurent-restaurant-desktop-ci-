import { api } from './client';

export const taxAnalyticsApi = {
  overview: (params) => api.get('/tax-analytics/overview', { params }),
  results: (params) => api.get('/tax-analytics/results', { params }),
};

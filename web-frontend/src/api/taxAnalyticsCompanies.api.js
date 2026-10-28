import { api } from './client';

export const taxAnalyticsCompaniesApi = {
  list: (params) => api.get('/tax-analytics/companies', { params }),
  detail: (companyId, params) => api.get(`/tax-analytics/companies/${companyId}`, { params }),
};

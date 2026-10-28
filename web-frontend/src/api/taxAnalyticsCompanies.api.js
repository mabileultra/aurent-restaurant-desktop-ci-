import { api } from './client';

export const taxAnalyticsCompaniesApi = {
  list: (params) => api.get('/tax-analytics/companies', { params }),
  detail: (companyId, params) => api.get(`/tax-analytics/companies/${companyId}`, { params }),
  receipts: (companyId, params) => api.get(`/tax-analytics/companies/${companyId}/receipts`, { params }),
  receipt: (companyId, saleId) => api.get(`/tax-analytics/companies/${companyId}/receipts/${saleId}`),
};

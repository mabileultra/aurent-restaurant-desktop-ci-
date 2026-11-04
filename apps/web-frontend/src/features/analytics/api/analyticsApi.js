import { api } from '../../../api/client';

export const analyticsApi = {
  getOverview: (params) => api.get('/tax-analytics/overview', { params }),
  getResults: (params) => api.get('/tax-analytics/results', { params }),
  getCompanies: (params) => api.get('/tax-analytics/companies', { params }),
  getCompanyDetail: (companyId, params) =>
    api.get(`/tax-analytics/companies/${companyId}`, { params }),
  getCompanyReceipts: (companyId, params) =>
    api.get(`/tax-analytics/companies/${companyId}/receipts`, { params }),
  getCompanyReceiptDetail: (companyId, saleId) =>
    api.get(`/tax-analytics/companies/${companyId}/receipts/${saleId}`),
  getRegions: () => api.get('/geo/regions'),
  getDistricts: (regionCode) => api.get(`/geo/districts/${regionCode}`),
};

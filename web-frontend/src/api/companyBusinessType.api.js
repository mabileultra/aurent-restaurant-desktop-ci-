import { api } from './client';

export const companyBusinessTypeApi = {
  get: () => api.get('/company-business-types'),
  getForCompany: (companyId) => api.get(`/admin/companies/${companyId}/business-types`),
  setForCompany: (companyId, body) => api.put(`/admin/companies/${companyId}/business-types`, body),
};

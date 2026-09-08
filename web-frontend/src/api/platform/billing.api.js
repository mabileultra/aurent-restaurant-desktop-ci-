import { api } from '../client';

export const platformBillingApi = {
  overview: () => api.get('/platform/billing/overview'),
  plans: (params) => api.get('/platform/billing/plans', { params }),
  createPlan: (payload) => api.post('/platform/billing/plans', payload),
  updatePlan: (planId, payload) => api.put(`/platform/billing/plans/${planId}`, payload),
  companies: (params) => api.get('/platform/billing/companies', { params }),
  company: (companyId) => api.get(`/platform/billing/companies/${companyId}`),
  assignPlan: (companyId, payload) => api.put(`/platform/billing/companies/${companyId}/plan`, payload),
  topUp: (companyId, payload) => api.post(`/platform/billing/companies/${companyId}/top-up`, payload),
  charge: (companyId, payload) => api.post(`/platform/billing/companies/${companyId}/charge`, payload),
  block: (companyId) => api.post(`/platform/billing/companies/${companyId}/block`),
  unblock: (companyId) => api.post(`/platform/billing/companies/${companyId}/unblock`),
  ledger: (companyId, params) => api.get(`/platform/billing/companies/${companyId}/ledger`, { params }),
  topUps: (params) => api.get('/platform/billing/top-ups', { params }),
  approveTopUp: (requestId, payload) => api.post(`/platform/billing/top-ups/${requestId}/approve`, payload || {}),
  rejectTopUp: (requestId, payload) => api.post(`/platform/billing/top-ups/${requestId}/reject`, payload || {}),
  runCharges: () => api.post('/platform/billing/run-charges'),
};

export const tenantBillingApi = {
  me: () => api.get('/billing/me'),
  access: () => api.get('/billing/me/access'),
  plans: () => api.get('/billing/plans'),
  ledger: (params) => api.get('/billing/me/ledger', { params }),
  topUps: (params) => api.get('/billing/me/top-ups', { params }),
  submitTopUp: ({ amount, comment, file }) => {
    const fd = new FormData();
    fd.append('amount', String(amount));
    if (comment) fd.append('comment', comment);
    if (file) fd.append('file', file);
    return api.post('/billing/me/top-ups', fd);
  },
  createPayment: (payload) => api.post('/billing/me/payments', payload),
};

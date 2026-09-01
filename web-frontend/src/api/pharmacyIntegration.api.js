import { api } from './client';

export const pharmacyIntegrationApi = {
  getCashierCapabilities: (storeId) =>
    api.get('/cashier/pharmacy-integration', { params: { storeId } }),
  verifyMarking: (payload) =>
    api.post('/cashier/pharmacy-integration/marking/verify', payload),
  getAdminSettings: (storeId) =>
    api.get(`/admin/stores/${storeId}/pharmacy-integration`),
  saveAdminSettings: (storeId, payload) =>
    api.put(`/admin/stores/${storeId}/pharmacy-integration`, payload),
};

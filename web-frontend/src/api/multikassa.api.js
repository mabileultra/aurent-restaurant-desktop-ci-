import { api } from './client';

export const multikassaApi = {
  getAdminSettings: (cashRegisterId) =>
    api.get(`/admin/cash-registers/${cashRegisterId}/multikassa`),
  saveAdminSettings: (cashRegisterId, payload) =>
    api.put(`/admin/cash-registers/${cashRegisterId}/multikassa`, payload),
  getCashierCapabilities: (storeId, cashRegisterId) =>
    api.get('/cashier/multikassa', {
      params: {
        storeId,
        ...(cashRegisterId != null ? { cashRegisterId } : {}),
      },
    }),
};

import { api } from './client';

export const cashRegisterApi = {
  getAll: (params) => api.get('/cash-registers', { params }),
  getTransfers: (params) => api.get('/cash-registers/transfers', { params }),
  exportTransfers: (params) =>
    api.get('/cash-registers/transfers/export', { params, responseType: 'blob' }),
  getEquipmentSerials: () => api.get('/cash-registers/equipment-serials'),
  getById: (id) => api.get(`/cash-registers/${id}`),
  create: (data) => api.post('/cash-registers', data),
  update: (id, data) => api.put(`/cash-registers/${id}`, data),
  toggleStatus: (id) => api.patch(`/cash-registers/${id}/toggle-status`),
};

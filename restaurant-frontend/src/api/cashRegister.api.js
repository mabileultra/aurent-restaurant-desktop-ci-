import { api } from './client';

export const cashRegisterApi = {
  getAll: (params) => api.get('/cash-registers', { params }),
  getById: (id) => api.get(`/cash-registers/${id}`),
};

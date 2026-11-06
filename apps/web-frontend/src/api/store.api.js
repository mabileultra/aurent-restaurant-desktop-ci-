import { api } from './client';

export const storeApi = {
  getAll: (params) => api.get('/stores', { params }),
  getManaged: (params) => api.get('/stores/manage', { params }),
  getStats: (params) => api.get('/stores/stats', { params }),
  getByCompany: (params) => api.get('/stores/by-company', { params }),
  getById: (id) => api.get(`/stores/${id}`),
  create: (data) => api.post('/stores', data),
  update: (id, data) => api.put(`/stores/${id}`, data),
  toggle: (id) => api.patch(`/stores/${id}/toggle-active`),
  delete: (id) => api.delete(`/stores/${id}`),
};

import { api } from './client';

export const userApi = {
  getAll: () => api.get('/users'),
  getPosRoster: (storeId) => api.get('/users/pos-roster', { params: { storeId } }),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, d) => api.put(`/users/${id}`, d),
  toggle: (id) => api.patch(`/users/${id}/toggle-active`),
  delete: (id) => api.delete(`/users/${id}`),
};

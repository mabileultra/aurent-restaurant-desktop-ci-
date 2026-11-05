import { api } from './client';

export const orderApi = {
  getAll: (params) => api.get('/orders', { params }),
  getById: (id) => api.get(`/orders/${id}`),
  getCouriers: () => api.get('/orders/couriers'),
  create: (body) => api.post('/orders', body),
  update: (id, body) => api.put(`/orders/${id}`, body),
  cancel: (id) => api.delete(`/orders/${id}`),
};

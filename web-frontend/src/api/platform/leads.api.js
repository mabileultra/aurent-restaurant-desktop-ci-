import { api } from './client';

export const platformLeadsApi = {
  list: (params) => api.get('/platform/leads', { params }),
  getById: (id) => api.get(`/platform/leads/${id}`),
  update: (id, payload) => api.patch(`/platform/leads/${id}`, payload),
};

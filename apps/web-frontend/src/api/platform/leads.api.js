import { api } from '../client';

export const platformLeadsApi = {
  list: (params) => api.get('/platform/leads', { params }),
  stats: () => api.get('/platform/leads/stats'),
  getById: (id) => api.get(`/platform/leads/${id}`),
  update: (id, payload) => api.patch(`/platform/leads/${id}`, payload),
  delete: (id) => api.delete(`/platform/leads/${id}`),
  events: (id) => api.get(`/platform/leads/${id}/events`),
  addComment: (id, payload) => api.post(`/platform/leads/${id}/comments`, payload),
  convert: (id, payload) => api.post(`/platform/leads/${id}/convert`, payload),
};

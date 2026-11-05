import { api } from '../client';

export const platformReferenceBookApi = {
  list: () => api.get('/platform/reference-books'),
  get: (id) => api.get(`/platform/reference-books/${id}`),
  create: (body) => api.post('/platform/reference-books', body),
  update: (id, body) => api.put(`/platform/reference-books/${id}`, body),
  delete: (id) => api.delete(`/platform/reference-books/${id}`),
};

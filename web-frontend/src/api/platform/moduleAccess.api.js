import { api } from '../client';

export const platformModuleAccessApi = {
  catalog: () => api.get('/platform/module-access/catalog'),
  stats: (params = {}) => api.get('/platform/module-access/stats', { params }),
  listUsers: (params = {}) => api.get('/platform/module-access/users', { params }),
  getUser: (userId) => api.get(`/platform/module-access/users/${userId}`),
  updateUser: (userId, body) => api.put(`/platform/module-access/users/${userId}`, body),
  resetUser: (userId) => api.delete(`/platform/module-access/users/${userId}`),
};

import { api } from '../client';

export const platformModuleAccessApi = {
  catalog: () => api.get('/platform/module-access/catalog'),
  stats: (params = {}) => api.get('/platform/module-access/stats', { params }),
  getRoleTemplate: (businessType, role) =>
    api.get(`/platform/module-access/role-templates/${encodeURIComponent(businessType)}/${encodeURIComponent(role)}`),
  updateRoleTemplate: (businessType, role, body) =>
    api.put(
      `/platform/module-access/role-templates/${encodeURIComponent(businessType)}/${encodeURIComponent(role)}`,
      body
    ),
  listUsers: (params = {}) => api.get('/platform/module-access/users', { params }),
  getUser: (userId) => api.get(`/platform/module-access/users/${userId}`),
  updateUser: (userId, body) => api.put(`/platform/module-access/users/${userId}`, body),
  resetUser: (userId) => api.delete(`/platform/module-access/users/${userId}`),
  copy: (body) => api.post('/platform/module-access/copy', body),
  bulkReset: (body) => api.post('/platform/module-access/bulk-reset', body),
  history: (params = {}) => api.get('/platform/module-access/history', { params }),
  revertHistory: (historyId) => api.post(`/platform/module-access/history/${historyId}/revert`),
};

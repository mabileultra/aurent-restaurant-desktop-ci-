import { api } from '../client';

export const platformSecurityApi = {
  getCashierServerPassword: () => api.get('/platform/security/cashier-server-password'),
  updateCashierServerPassword: (password) =>
    api.put('/platform/security/cashier-server-password', { password }),
  listSuperAdmins: () => api.get('/platform/security/super-admins'),
  createSuperAdmin: (body) => api.post('/platform/security/super-admins', body),
  updateSuperAdmin: (id, body) => api.put(`/platform/security/super-admins/${id}`, body),

  listSessions: () => api.get('/platform/security/sessions'),
  revokeSession: (sessionId) => api.delete(`/platform/security/sessions/${sessionId}`),
  revokeOtherSessions: () => api.post('/platform/security/sessions/revoke-others'),

  getLoginRules: () => api.get('/platform/security/login-rules'),
  saveLoginRules: (body, sudoToken) =>
    api.put('/platform/security/login-rules', body, {
      headers: sudoToken ? { 'X-Sudo-Token': sudoToken } : undefined,
    }),

  reauth: (body) => api.post('/platform/security/reauth', body),

  getTwoFactor: () => api.get('/platform/security/2fa'),
  setupTwoFactor: () => api.post('/platform/security/2fa/setup'),
  enableTwoFactor: (code) => api.post('/platform/security/2fa/enable', { code }),
  disableTwoFactor: (body) => api.post('/platform/security/2fa/disable', body),
};

import { api } from './client';

export const authApi = {
  exchangeHandoff: (code) => api.post('/auth/handoff/exchange', { code }),
  login: (data) => api.post('/auth/login', data),
};

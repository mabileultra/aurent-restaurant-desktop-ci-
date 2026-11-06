import { exchangeHandoff } from '@aurent/shared-auth';
import { api } from './client';

export const authApi = {
  exchangeHandoff: (code) => exchangeHandoff(api, code),
  login: (data) => api.post('/auth/login', data),
  cashierPinLogin: (data) => api.post('/auth/cashier-pin/login', data),
  verifyPin: (data) => api.post('/auth/verify-pin', data),
  verifyPassword: (data) => api.post('/auth/verify-password', data),
};

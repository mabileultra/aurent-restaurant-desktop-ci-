import { exchangeHandoff } from '@aurent/shared-auth';
import { api } from './client';

export const authApi = {
  exchangeHandoff: (code) => exchangeHandoff(api, code),
  login: (data) => api.post('/auth/login', data),
};

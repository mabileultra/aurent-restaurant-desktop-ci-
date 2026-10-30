import { api } from '../client';

export const platformCashRegistersApi = {
  getStats: () => api.get('/platform/cash-registers/stats'),
};

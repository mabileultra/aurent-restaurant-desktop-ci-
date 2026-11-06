import { api } from '../client';

export const platformAccountApi = {
  current: () => api.get('/platform/account'),
  update: (body) => api.put('/platform/account', body),
};

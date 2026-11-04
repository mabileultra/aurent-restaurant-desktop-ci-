import { api } from './client';

export const stockWriteOffApi = {
  create: (body) => api.post('/warehouse/write-offs', body),
};

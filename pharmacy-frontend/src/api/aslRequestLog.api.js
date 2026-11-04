import { api } from './client';

export const aslRequestLogApi = {
  list: (params = {}) => api.get('/admin/asl-request-logs', { params }),
};

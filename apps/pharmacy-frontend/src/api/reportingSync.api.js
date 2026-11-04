import { api } from './client';

export const reportingSyncApi = {
  backfill: (params) => api.post('/admin/reporting-sync/backfill', null, { params }),
};

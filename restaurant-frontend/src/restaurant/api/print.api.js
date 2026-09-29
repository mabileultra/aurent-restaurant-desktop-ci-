import { api } from '../../api/client';

const rst = (path) => `/rst${path}`;

export const rstPrintApi = {
  pollPending: (storeId) => api.get(rst(`/stores/${storeId}/print-jobs/pending`)),
  acknowledge: (storeId, jobIds) => api.post(rst(`/stores/${storeId}/print-jobs/ack`), { jobIds }),
};

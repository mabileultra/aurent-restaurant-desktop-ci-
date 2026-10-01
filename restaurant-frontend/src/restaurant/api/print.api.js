import { api } from '../../api/client';

const rst = (path) => `/rst${path}`;

export const rstPrintApi = {
  /** @deprecated prefer claimPending with desktop capabilities */
  pollPending: (storeId) => api.get(rst(`/stores/${storeId}/print-jobs/pending`)),
  claimPending: (storeId, capabilities) =>
    api.post(rst(`/stores/${storeId}/print-jobs/claim`), capabilities || {
      printerNames: [],
      guestBill: false,
      kitchenSend: false,
    }),
  acknowledge: (storeId, jobIds) => api.post(rst(`/stores/${storeId}/print-jobs/ack`), { jobIds }),
  release: (storeId, jobIds) => api.post(rst(`/stores/${storeId}/print-jobs/release`), { jobIds }),
};

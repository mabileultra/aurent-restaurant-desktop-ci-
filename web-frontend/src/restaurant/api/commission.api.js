import { api } from '../../api/client';

const rst = (path) => `/rst${path}`;

export const rstCommissionApi = {
  getSettings: (storeId) => api.get(rst(`/stores/${storeId}/waiter-commission`)),
  setDefault: (storeId, percent) => api.put(rst(`/stores/${storeId}/waiter-commission/default`), { percent }),
  setWaiter: (storeId, userId, percent) => api.put(
    rst(`/stores/${storeId}/waiter-commission/waiters/${userId}`),
    { percent },
  ),
  clearWaiter: (storeId, userId) => api.delete(rst(`/stores/${storeId}/waiter-commission/waiters/${userId}`)),
  applyAll: (storeId, percent) => api.post(rst(`/stores/${storeId}/waiter-commission/apply-all`), { percent }),
  report: (storeId, params = {}) => api.get(rst(`/stores/${storeId}/reports/waiter-commission`), { params }),
};

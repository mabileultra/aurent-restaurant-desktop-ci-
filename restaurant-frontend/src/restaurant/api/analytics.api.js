import { api } from '../../api/client';

const rst = (path) => `/rst${path}`;

export const rstAnalyticsApi = {
  dashboard: (storeId, params = {}) => api.get(rst(`/stores/${storeId}/dashboard`), { params }),
  salesReport: (storeId, params = {}) => api.get(rst(`/stores/${storeId}/reports/sales`), { params }),
  activity: (storeId, params = {}) => api.get(rst(`/stores/${storeId}/activity`), { params }),
};

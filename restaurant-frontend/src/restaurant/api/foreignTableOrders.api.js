import { api } from '../../api/client';

const rst = (path) => `/rst${path}`;

export const rstForeignTableOrdersApi = {
  get: (storeId) => api.get(rst(`/stores/${storeId}/foreign-table-orders`)),
  setAllowed: (storeId, allowed) => api.put(rst(`/stores/${storeId}/foreign-table-orders`), { allowed }),
};

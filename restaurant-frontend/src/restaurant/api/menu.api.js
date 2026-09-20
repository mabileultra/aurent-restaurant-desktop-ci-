import { api } from '../../api/client';

const rst = (path) => `/rst${path}`;

export const rstMenuApi = {
  list: (storeId, posOnly = false) => api.get(rst(`/stores/${storeId}/menu-items`), { params: { posOnly } }),
  create: (storeId, data) => api.post(rst(`/stores/${storeId}/menu-items`), data),
  update: (itemId, data) => api.put(rst(`/menu-items/${itemId}`), data),
  deactivate: (itemId) => api.delete(rst(`/menu-items/${itemId}`)),
};

import { api } from '../../api/client';

const rst = (path) => `/rst${path}`;

export const rstMenuPhotoApi = {
  get: (storeId) => api.get(rst(`/stores/${storeId}/menu-photos`)),
  setEnabled: (storeId, enabled) => api.put(rst(`/stores/${storeId}/menu-photos`), { enabled }),
};

import { api } from '../../api/client';

const rst = (path) => `/rst${path}`;

export const rstRecipeApi = {
  list: (storeId) => api.get(rst(`/stores/${storeId}/recipes`)),
  get: (menuItemId) => api.get(rst(`/menu-items/${menuItemId}/recipe`)),
  save: (menuItemId, data) => api.put(rst(`/menu-items/${menuItemId}/recipe`), data),
};

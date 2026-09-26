import { api } from '../../api/client';

const rst = (path) => `/rst${path}`;

export const rstMenuApi = {
  list: (storeId, posOnly = false) => api.get(rst(`/stores/${storeId}/menu-items`), { params: { posOnly } }),
  create: (storeId, data) => api.post(rst(`/stores/${storeId}/menu-items`), data),
  update: (itemId, data) => api.put(rst(`/menu-items/${itemId}`), data),
  createVariant: (itemId, data) => api.post(rst(`/menu-items/${itemId}/variants`), data),
  deactivate: (itemId) => api.delete(rst(`/menu-items/${itemId}`)),
  listCategories: (storeId, activeOnly = false) =>
    api.get(rst(`/stores/${storeId}/menu-categories`), { params: { activeOnly } }),
  createCategory: (storeId, data) => api.post(rst(`/stores/${storeId}/menu-categories`), data),
  updateCategory: (categoryId, data) => api.put(rst(`/menu-categories/${categoryId}`), data),
  deactivateCategory: (categoryId) => api.delete(rst(`/menu-categories/${categoryId}`)),
};

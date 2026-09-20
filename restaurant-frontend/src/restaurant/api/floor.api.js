import { api } from '../../api/client';

const rst = (path) => `/rst${path}`;

export const rstFloorApi = {
  getFloorSnapshot: (storeId) => api.get(rst(`/stores/${storeId}/floor`)),
  listHalls: (storeId) => api.get(rst(`/stores/${storeId}/halls`)),
  createHall: (storeId, data) => api.post(rst(`/stores/${storeId}/halls`), data),
  updateHall: (hallId, data) => api.put(rst(`/halls/${hallId}`), data),
  deactivateHall: (hallId) => api.delete(rst(`/halls/${hallId}`)),
  listTables: (hallId) => api.get(rst(`/halls/${hallId}/tables`)),
  createTable: (hallId, data) => api.post(rst(`/halls/${hallId}/tables`), data),
  updateTable: (tableId, data) => api.put(rst(`/tables/${tableId}`), data),
  updateLayout: (hallId, data) => api.put(rst(`/halls/${hallId}/tables/layout`), data),
  deactivateTable: (tableId) => api.delete(rst(`/tables/${tableId}`)),
};

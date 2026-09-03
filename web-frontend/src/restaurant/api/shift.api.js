import { api } from '../../api/client';

const rst = (path) => `/rst${path}`;

export const rstShiftApi = {
  current: (storeId) => api.get(rst(`/stores/${storeId}/shifts/current`)),
  list: (storeId) => api.get(rst(`/stores/${storeId}/shifts`)),
  open: (storeId, data) => api.post(rst(`/stores/${storeId}/shifts/open`), data),
  close: (shiftId, data) => api.post(rst(`/shifts/${shiftId}/close`), data),
};

import { api } from '../../api/client';

const rst = (path) => `/rst${path}`;

export const rstShiftApi = {
  current: (storeId) => api.get(rst(`/stores/${storeId}/shifts/current`)),
  list: (storeId) => api.get(rst(`/stores/${storeId}/shifts`)),
  open: (storeId, data) => api.post(rst(`/stores/${storeId}/shifts/open`), data),
  close: (shiftId, data) => api.post(rst(`/shifts/${shiftId}/close`), data),
  xReport: (shiftId) => api.get(rst(`/shifts/${shiftId}/x-report`)),
  zReportPreview: (shiftId) => api.get(rst(`/shifts/${shiftId}/z-report`)),
};

import { api } from './client';

export const pharmacyShiftApi = {
  current: (storeId) => api.get('/pharmacy/shifts/current', { params: { storeId } }),
  open: (storeId, body) => api.post('/pharmacy/shifts/open', body ?? null, { params: { storeId } }),
  close: (id, body) => api.post(`/pharmacy/shifts/${id}/close`, body ?? null),
};

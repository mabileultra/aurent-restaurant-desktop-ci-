import { api } from '../../api/client';

const rst = (path) => `/rst${path}`;

export const rstBookingApi = {
  listTables: (storeId) => api.get(rst(`/stores/${storeId}/booking-tables`)),
  list: (storeId, params = {}) => api.get(rst(`/stores/${storeId}/reservations`), { params }),
  create: (storeId, data) => api.post(rst(`/stores/${storeId}/reservations`), data),
  update: (id, data) => api.put(rst(`/reservations/${id}`), data),
  confirm: (id) => api.post(rst(`/reservations/${id}/confirm`)),
  cancel: (id) => api.post(rst(`/reservations/${id}/cancel`)),
  noShow: (id) => api.post(rst(`/reservations/${id}/no-show`)),
  seat: (id) => api.post(rst(`/reservations/${id}/seat`)),
};

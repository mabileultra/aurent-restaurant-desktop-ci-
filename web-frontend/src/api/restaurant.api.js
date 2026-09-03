import { api } from './client';

export const restaurantApi = {
  listReservations: (storeId, params) => api.get(`/restaurant/stores/${storeId}/reservations`, { params }),
  listBookingTables: (storeId) => api.get(`/restaurant/stores/${storeId}/booking-tables`),
  getReservation: (reservationId) => api.get(`/restaurant/reservations/${reservationId}`),
  createReservation: (storeId, data) => api.post(`/restaurant/stores/${storeId}/reservations`, data),
  updateReservation: (reservationId, data) => api.put(`/restaurant/reservations/${reservationId}`, data),
  confirmReservation: (reservationId) => api.post(`/restaurant/reservations/${reservationId}/confirm`),
  cancelReservation: (reservationId) => api.post(`/restaurant/reservations/${reservationId}/cancel`),
  noShowReservation: (reservationId) => api.post(`/restaurant/reservations/${reservationId}/no-show`),
};

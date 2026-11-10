import { api } from '../../api/client';

const rst = (path) => `/rst${path}`;

export const rstPaymentApi = {
  listRecentPaid: (storeId, { refunded = false, limit } = {}) =>
    api.get(rst(`/stores/${storeId}/orders/recent-paid`), {
      params: { refunded, ...(limit != null ? { limit } : {}) },
    }),
  getPayment: (orderId) => api.get(rst(`/orders/${orderId}/payment`)),
  /** OFD proof without QR URL — client rebuilds ofd.soliq.uz link. */
  attachFiscal: (orderId, data) => api.post(rst(`/orders/${orderId}/payment/fiscal`), data),
};

import { api } from '../../api/client';

const rst = (path) => `/rst${path}`;

export const rstOrderApi = {
  open: (tableId, data) => api.post(rst(`/tables/${tableId}/orders`), data),
  openTakeaway: (storeId, data = {}) => api.post(rst(`/stores/${storeId}/orders/takeaway`), data),
  openDelivery: (storeId, data) => api.post(rst(`/stores/${storeId}/orders/delivery`), data),
  listActive: (storeId, channel) => api.get(rst(`/stores/${storeId}/orders/active`), { params: { channel } }),
  listRecentCancelled: (storeId, { limit } = {}) =>
    api.get(rst(`/stores/${storeId}/orders/recent-cancelled`), {
      params: limit != null ? { limit } : {},
    }),
  listRecentCancelledItems: (storeId, { limit } = {}) =>
    api.get(rst(`/stores/${storeId}/orders/recent-cancelled-items`), {
      params: limit != null ? { limit } : {},
    }),
  search: (storeId, params) => api.get(rst(`/stores/${storeId}/orders`), { params }),
  get: (orderId) => api.get(rst(`/orders/${orderId}`)),
  updateGuests: (orderId, data) => api.patch(rst(`/orders/${orderId}/guests`), data),
  updateDeliveryDetails: (orderId, data) => api.patch(rst(`/orders/${orderId}/delivery`), data),
  updateDeliveryStatus: (orderId, data) => api.patch(rst(`/orders/${orderId}/delivery-status`), data),
  updateDiscount: (orderId, data) => api.patch(rst(`/orders/${orderId}/discount`), data),
  assignWaiter: (orderId, data) => api.patch(rst(`/orders/${orderId}/waiter`), data),
  transferTable: (orderId, data) => api.post(rst(`/orders/${orderId}/transfer-table`), data),
  mergeTables: (orderId, data) => api.post(rst(`/orders/${orderId}/merge-tables`), data),
  addItem: (orderId, data) => api.post(rst(`/orders/${orderId}/items`), data),
  updateItem: (orderId, itemId, data) => api.put(rst(`/orders/${orderId}/items/${itemId}`), data),
  removeItem: (orderId, itemId) => api.delete(rst(`/orders/${orderId}/items/${itemId}`)),
  cancel: (orderId) => api.post(rst(`/orders/${orderId}/cancel`)),
  sendToKitchen: (orderId) => api.post(rst(`/orders/${orderId}/send-to-kitchen`)),
  reprintPickupLabel: (orderId) => api.post(rst(`/orders/${orderId}/pickup-label`)),
  requestBill: (orderId) => api.post(rst(`/orders/${orderId}/bill`)),
  pay: (orderId, data) => api.post(rst(`/orders/${orderId}/pay`), data),
  refund: (orderId) => api.post(rst(`/orders/${orderId}/refund`)),
  refundItems: (orderId, data) => api.post(rst(`/orders/${orderId}/refund-items`), data),
};

import { api } from '../../api/client';

const rst = (path) => `/rst${path}`;

export const rstOrderApi = {
  open: (tableId, data) => api.post(rst(`/tables/${tableId}/orders`), data),
  openTakeaway: (storeId, data = {}) => api.post(rst(`/stores/${storeId}/orders/takeaway`), data),
  openDelivery: (storeId, data) => api.post(rst(`/stores/${storeId}/orders/delivery`), data),
  listActive: (storeId, channel) => api.get(rst(`/stores/${storeId}/orders/active`), { params: { channel } }),
  get: (orderId) => api.get(rst(`/orders/${orderId}`)),
  updateGuests: (orderId, data) => api.patch(rst(`/orders/${orderId}/guests`), data),
  addItem: (orderId, data) => api.post(rst(`/orders/${orderId}/items`), data),
  updateItem: (orderId, itemId, data) => api.put(rst(`/orders/${orderId}/items/${itemId}`), data),
  removeItem: (orderId, itemId) => api.delete(rst(`/orders/${orderId}/items/${itemId}`)),
  cancel: (orderId) => api.post(rst(`/orders/${orderId}/cancel`)),
  sendToKitchen: (orderId) => api.post(rst(`/orders/${orderId}/send-to-kitchen`)),
  requestBill: (orderId) => api.post(rst(`/orders/${orderId}/bill`)),
  pay: (orderId, data) => api.post(rst(`/orders/${orderId}/pay`), data),
};

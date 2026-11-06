import { api } from '../../api/client';

const rst = (path) => `/rst${path}`;

export const rstKitchenApi = {
  getKitchenBoard: (storeId) => api.get(rst(`/stores/${storeId}/kitchen-board`)),
  setKitchenBoard: (storeId, enabled) => api.put(rst(`/stores/${storeId}/kitchen-board`), { enabled }),
  getPrintProfile: (storeId) => api.get(rst(`/stores/${storeId}/print-profile`)),
  savePrintProfile: (storeId, profile) => api.put(rst(`/stores/${storeId}/print-profile`), { profile }),
  listStations: (storeId, activeOnly = false) =>
    api.get(rst(`/stores/${storeId}/kitchen-stations`), { params: { activeOnly } }),
  createStation: (storeId, data) => api.post(rst(`/stores/${storeId}/kitchen-stations`), data),
  updateStation: (stationId, data) => api.put(rst(`/kitchen-stations/${stationId}`), data),
  deactivateStation: (stationId) => api.delete(rst(`/kitchen-stations/${stationId}`)),
  sendToKitchen: (orderId) => api.post(rst(`/orders/${orderId}/send-to-kitchen`)),
  listTickets: (storeId, params) => api.get(rst(`/stores/${storeId}/kitchen-tickets`), { params }),
  updateTicketStatus: (ticketId, status) => api.patch(rst(`/kitchen-tickets/${ticketId}/status`), { status }),
};

import { api } from '../../api/client';

const rst = (path) => `/rst${path}`;

export const rstKitchenApi = {
  listStations: (storeId, activeOnly = false) =>
    api.get(rst(`/stores/${storeId}/kitchen-stations`), { params: { activeOnly } }),
  createStation: (storeId, data) => api.post(rst(`/stores/${storeId}/kitchen-stations`), data),
  updateStation: (stationId, data) => api.put(rst(`/kitchen-stations/${stationId}`), data),
  deactivateStation: (stationId) => api.delete(rst(`/kitchen-stations/${stationId}`)),
  sendToKitchen: (orderId) => api.post(rst(`/orders/${orderId}/send-to-kitchen`)),
  listTickets: (storeId) => api.get(rst(`/stores/${storeId}/kitchen-tickets`)),
  updateTicketStatus: (ticketId, status) => api.patch(rst(`/kitchen-tickets/${ticketId}/status`), { status }),
};

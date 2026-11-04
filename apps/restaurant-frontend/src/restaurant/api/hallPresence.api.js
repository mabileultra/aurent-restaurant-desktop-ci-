import { api } from '../../api/client';

export const hallPresenceApi = {
  status: (storeId) => api.get(`/rst/stores/${storeId}/hall-presence`),
};

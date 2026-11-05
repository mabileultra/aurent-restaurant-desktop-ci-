import { api } from '../client';

export const platformDesktopNotificationsApi = {
  list: () => api.get('/platform/desktop-notifications'),
  broadcast: (body) => api.post('/platform/desktop-notifications/broadcast', body),
  revoke: (id) => api.delete(`/platform/desktop-notifications/${id}`),
  extend: (id, body) => api.patch(`/platform/desktop-notifications/${id}`, body),
};

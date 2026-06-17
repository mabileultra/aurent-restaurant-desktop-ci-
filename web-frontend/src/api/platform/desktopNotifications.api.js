import { api } from '../client';

export const platformDesktopNotificationsApi = {
  list: () => api.get('/platform/desktop-notifications'),
  broadcast: (body) => api.post('/platform/desktop-notifications/broadcast', body),
};

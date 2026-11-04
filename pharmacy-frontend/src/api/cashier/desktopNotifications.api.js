import { api } from '../client';

export const cashierDesktopNotificationsApi = {
  unread: () => api.get('/cashier/desktop-notifications'),
  markRead: (id) => api.post(`/cashier/desktop-notifications/${id}/read`),
};

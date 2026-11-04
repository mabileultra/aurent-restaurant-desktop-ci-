import { api } from './client';

/** Контакты поддержки CRM/кассы с backend (не аптечный бот). */
export const supportApi = {
  getContacts: () => api.get('/public/support-contacts').then((r) => r.data),
};

import { api } from './client';

export const publicSiteApi = {
  submitLead: (payload) => api.post('/public/site/leads', payload),
};

import { api } from './client';

/** Local edge auth endpoints (restaurant-service when profile=edge). */
export const edgeAuthApi = {
  status: () => api.get('/edge/auth/status'),
  bootstrapStaff: (payload) => api.post('/edge/auth/bootstrap-staff', payload),
};

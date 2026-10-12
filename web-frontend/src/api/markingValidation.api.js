import { api } from './client';

export const markingValidationApi = {
  validate: (payload) => api.post('/cashier/marking/validate', payload),
};

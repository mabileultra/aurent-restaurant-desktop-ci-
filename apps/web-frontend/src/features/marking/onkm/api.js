import { api } from '../../../api/client';

/** HTTP кассы → наш backend. Soliq отсюда не вызываем. */
export const markingValidationApi = {
  validate: (payload) => api.post('/cashier/marking/validate', payload),
};

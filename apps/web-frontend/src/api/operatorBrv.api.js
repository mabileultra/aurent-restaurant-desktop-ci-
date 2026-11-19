import { api } from './client';

/** БРВ и порог наличной оплаты с сервера оператора (AUR-13). */
export const operatorBrvApi = {
  get: () => api.get('/operator/brv'),
};

import { api } from './client';

export const cashierTerminalApi = {
  register: (storeId, terminal) =>
    api.post('/cashier/terminal/register', terminal, { params: { storeId } }),
};

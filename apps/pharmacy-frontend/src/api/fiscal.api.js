import { api } from './client';

/** Провайдер фискализации кассы. Не Multikassa API и не админка FiscalDrive. */
export const fiscalApi = {
  getCashierCapabilities: (storeId, cashRegisterId) =>
    api.get('/cashier/fiscal', {
      params: {
        storeId,
        ...(cashRegisterId != null ? { cashRegisterId } : {}),
      },
    }),
};

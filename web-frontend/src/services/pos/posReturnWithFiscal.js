import { saleApi } from '../../api/sale.api';
import {
  fiscalizeRefundBeforeCommit,
  loadMultikassaCapabilities,
  wrapMultikassaFiscalError,
} from '../multikassa';
import { resolvePosRoute } from './posRouteResolver';
import { useConnectivityStore } from '../../store/connectivityStore';

/**
 * Partial return: Multikassa op 4 (если чек был фискализирован) → POST /sales/{id}/return-items.
 */
export async function posReturnSaleItems({ sale, payload, storeId }) {
  const store = storeId ?? sale?.storeId;
  const route = resolvePosRoute(store, useConnectivityStore.getState()).route;
  const offline = route === 'local';

  try {
    const capabilities = await loadMultikassaCapabilities(store, sale?.cashRegisterId ?? null);
    await fiscalizeRefundBeforeCommit({
      capabilities,
      sale,
      offline,
    });
  } catch (err) {
    throw wrapMultikassaFiscalError(err);
  }

  return saleApi.returnItems(sale.id, payload).then((r) => r.data);
}

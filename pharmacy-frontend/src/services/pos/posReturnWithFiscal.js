import { saleApi } from '../../api/sale.api';
import { pharmacySalesApi } from '../../api/pharmacySales.api';
import { loadFiscalContext, wrapFiscalError } from '../fiscal';
import { clearSoldMarks } from '../../features/marking';
import { resolvePosRoute } from './posRouteResolver';
import { useConnectivityStore } from '../../store/connectivityStore';

export function isPharmacyReceiptNumber(receiptNumber) {
  return String(receiptNumber || '')
    .trim()
    .toUpperCase()
    .startsWith('PHR-');
}

export function resolveSaleCatalogKind({ catalogKind, receiptNumber, sale } = {}) {
  if (catalogKind === 'pharmacy' || catalogKind === 'grocery') {
    return catalogKind;
  }
  if (
    isPharmacyReceiptNumber(receiptNumber) ||
    isPharmacyReceiptNumber(sale?.receiptNumber)
  ) {
    return 'pharmacy';
  }
  return 'grocery';
}

function salesClient(catalogKind) {
  return catalogKind === 'pharmacy' ? pharmacySalesApi : saleApi;
}

export async function posLookupSaleReceipt(receiptNumber, { catalogKind } = {}) {
  const code = String(receiptNumber ?? '').trim();
  const kind = resolveSaleCatalogKind({ catalogKind, receiptNumber: code });
  if (kind === 'pharmacy') {
    return salesClient('pharmacy').getReceipt(code).then((r) => r.data);
  }
  try {
    return await salesClient('grocery').getReceipt(code).then((r) => r.data);
  } catch (err) {
    if (err?.response?.status === 404) {
      return salesClient('pharmacy').getReceipt(code).then((r) => r.data);
    }
    throw err;
  }
}

export async function posFetchSaleById(saleId, { catalogKind, receiptNumber } = {}) {
  const kind = resolveSaleCatalogKind({ catalogKind, receiptNumber });
  return salesClient(kind).getById(saleId).then((r) => r.data);
}

/**
 * Partial return: Multikassa op 4 (если чек был фискализирован) → POST …/return-items.
 */
export async function posReturnSaleItems({ sale, payload, storeId, catalogKind }) {
  const store = storeId ?? sale?.storeId;
  const route = resolvePosRoute(store, useConnectivityStore.getState()).route;
  const offline = route === 'local';
  const kind = resolveSaleCatalogKind({ catalogKind, sale });

  let fiscal = null;
  try {
    fiscal = await loadFiscalContext(store, sale?.cashRegisterId ?? null);
    await fiscal.provider.fiscalizeRefund({
      capabilities: fiscal.capabilities,
      sale,
      offline,
    });
  } catch (err) {
    throw wrapFiscalError(err, fiscal?.provider);
  }

  const data = await salesClient(kind).returnItems(sale.id, payload).then((r) => r.data);
  if (store) {
    clearSoldMarks(store);
  }
  return data;
}

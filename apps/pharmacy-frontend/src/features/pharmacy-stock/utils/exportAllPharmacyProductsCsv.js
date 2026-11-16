import { pharmacyWarehouseApi } from '../../../api';
import { downloadPharmacyProductsCsv } from './pharmacyProductsExportCsv';
import { fetchAllPharmacyProductPages } from './fetchAllPharmacyProductPages';

/** Тянет все страницы по текущим фильтрам и скачивает CSV. */
export async function exportAllPharmacyProductsCsv({
  t,
  search,
  scope,
  supplierId,
  receiptId,
}) {
  const { content } = await fetchAllPharmacyProductPages({
    listProducts: (params) => pharmacyWarehouseApi.listProducts(params).then((r) => r.data),
    pageSize: 100,
    params: {
      search: search?.trim() || undefined,
      scope,
      activeOnly: scope === 'ACTIVE',
      fromReceipts: false,
      supplierId: supplierId || undefined,
      receiptId: receiptId || undefined,
    },
  });
  if (!content.length) {
    return 0;
  }
  downloadPharmacyProductsCsv(content, t);
  return content.length;
}

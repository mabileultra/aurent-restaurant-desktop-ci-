import { format, parseISO } from 'date-fns';

/**
 * Builds API query parameters for sales ledger pagination and filters.
 *
 * @param {object} applied - Applied filter criteria
 * @param {object} pagination - Page, size and search query
 * @returns {object} Formatted query parameters
 */
export function buildSalesQueryParams(applied = {}, { page = 0, pageSize = 20, search = '' } = {}) {
  const trimmedSearch = typeof search === 'string' ? search.trim() : '';
  const receiptNum = typeof applied.receiptNumber === 'string' ? applied.receiptNumber.trim() : '';
  const sId = typeof applied.saleId === 'string' ? applied.saleId.trim() : '';
  const cName = typeof applied.cashierName === 'string' ? applied.cashierName.trim() : '';

  return {
    page,
    size: pageSize,
    search: trimmedSearch || undefined,
    from: applied.dateFrom || undefined,
    to: applied.dateTo || undefined,
    receiptNumber: receiptNum || undefined,
    saleId: sId || undefined,
    cashierName: cName || undefined,
    paymentMethod: applied.paymentMethod || undefined,
    paymentSettlement: applied.paymentSettlement === 'ALL' ? undefined : applied.paymentSettlement,
    storeId: applied.storeId === '' || applied.storeId == null ? undefined : Number(applied.storeId),
  };
}

/**
 * Builds API query parameters for sales excel export.
 *
 * @param {object} applied - Applied filter criteria
 * @param {string} search - Search query
 * @returns {object} Formatted export parameters
 */
export function buildSalesExportParams(applied = {}, search = '') {
  const trimmedSearch = typeof search === 'string' ? search.trim() : '';
  const receiptNum = typeof applied.receiptNumber === 'string' ? applied.receiptNumber.trim() : '';
  const sId = typeof applied.saleId === 'string' ? applied.saleId.trim() : '';
  const cName = typeof applied.cashierName === 'string' ? applied.cashierName.trim() : '';

  return {
    search: trimmedSearch || undefined,
    from: applied.dateFrom || undefined,
    to: applied.dateTo || undefined,
    receiptNumber: receiptNum || undefined,
    saleId: sId || undefined,
    cashierName: cName || undefined,
    paymentMethod: applied.paymentMethod || undefined,
    paymentSettlement: applied.paymentSettlement === 'ALL' ? undefined : applied.paymentSettlement,
    storeId: applied.storeId === '' || applied.storeId == null ? undefined : Number(applied.storeId),
  };
}

/**
 * Enriches sales rows with store names from loaded stores list.
 *
 * @param {Array} content - Sales rows from API
 * @param {Array} stores - Stores list
 * @returns {Array} Enriched rows
 */
export function enrichSalesRowsWithStores(content = [], stores = []) {
  if (!Array.isArray(content)) return [];
  if (!Array.isArray(stores) || stores.length === 0) return content;

  const nameById = new Map(
    stores
      .filter((s) => s?.id != null)
      .map((s) => [Number(s.id), s.name])
  );

  return content.map((row) => {
    if (row.storeName || row.storeId == null) return row;
    const name = nameById.get(Number(row.storeId));
    return name ? { ...row, storeName: name } : row;
  });
}

/**
 * Formats an ISO date string into yyyy-MM-dd, HH:mm:ss.
 *
 * @param {string|Date} iso - Date value
 * @returns {string} Formatted date string
 */
export function formatSaleDateTime(iso) {
  if (!iso) return '—';
  try {
    const d = typeof iso === 'string' ? parseISO(iso) : new Date(iso);
    return format(d, 'yyyy-MM-dd, HH:mm:ss');
  } catch {
    return '—';
  }
}


/**
 * Triggers sales ledger Excel export download.
 *
 * @param {object} exportParams - API parameters
 * @param {object} options - Options containing isPharmacy, t, and saleApi
 */
export async function exportSalesExcelFile(exportParams, { isPharmacy, t, saleApi, toast }) {
  if (isPharmacy) {
    toast.error(t('salesLedger.exportPharmacySoon', {
      defaultValue: 'Экспорт Excel для аптеки пока недоступен',
    }));
    return;
  }
  try {
    const res = await saleApi.exportLines(exportParams);
    const blob = new Blob([res.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales_ledger_export_${new Date().toISOString().slice(0, 10)}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t('salesLedger.exportDone'));
  } catch (e) {
    toast.error(e?.response?.data?.message ?? t('salesLedger.exportFailed'));
  }
}

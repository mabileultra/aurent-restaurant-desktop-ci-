import { format, parseISO } from 'date-fns';

/**
 * Builds API query parameters for returns pagination and search.
 *
 * @param {object} applied - Applied filters
 * @param {object} pagination - Page, size, and search term
 * @returns {object} Formatted query parameters
 */
export function buildReturnsQueryParams(applied = {}, { page = 0, pageSize = 20, search = '' } = {}) {
  const fiscal = typeof search === 'string' ? search.trim() : '';
  const cashier = typeof applied.cashierName === 'string' ? applied.cashierName.trim() : '';

  return {
    page,
    size: pageSize,
    fiscalSearch: fiscal || undefined,
    from: applied.dateFrom || undefined,
    to: applied.dateTo || undefined,
    cashierName: cashier || undefined,
    storeId: applied.storeId === '' || applied.storeId == null ? undefined : Number(applied.storeId),
  };
}

/**
 * Builds API parameters for returns excel export.
 *
 * @param {object} applied - Applied filters
 * @param {string} search - Search term
 * @returns {object} Formatted export parameters
 */
export function buildReturnsExportParams(applied = {}, search = '') {
  const fiscal = typeof search === 'string' ? search.trim() : '';
  const cashier = typeof applied.cashierName === 'string' ? applied.cashierName.trim() : '';

  return {
    fiscalSearch: fiscal || undefined,
    from: applied.dateFrom || undefined,
    to: applied.dateTo || undefined,
    cashierName: cashier || undefined,
    storeId: applied.storeId === '' || applied.storeId == null ? undefined : Number(applied.storeId),
  };
}

/**
 * Enriches returns rows with store names from loaded stores list.
 *
 * @param {Array} content - Returns rows
 * @param {Array} stores - Stores list
 * @returns {Array} Enriched rows
 */
export function enrichReturnsRowsWithStores(content = [], stores = []) {
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
 * Formats an ISO date into dd.MM.yyyy HH:mm format.
 *
 * @param {string|Date} iso - ISO date
 * @returns {string} Formatted string
 */
export function formatReturnDateTime(iso) {
  if (!iso) return '—';
  try {
    const d = typeof iso === 'string' ? parseISO(iso) : new Date(iso);
    return format(d, 'dd.MM.yyyy HH:mm');
  } catch {
    return '—';
  }
}

/**
 * Executes returns excel export download.
 *
 * @param {object} exportParams - API parameters
 * @param {object} options - Execution context
 */
export async function exportReturnsExcelFile(exportParams, { applied = {}, isPharmacy, t, returnApi, toast, setExporting }) {
  if (isPharmacy) {
    toast.error(t('returnsModule.exportPharmacySoon', {
      defaultValue: 'Экспорт Excel для аптеки пока недоступен',
    }));
    return;
  }
  setExporting(true);
  try {
    const res = await returnApi.exportExcel(exportParams);
    const blob = new Blob([res.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const suffix =
      applied.dateFrom && applied.dateTo
        ? `${applied.dateFrom}_${applied.dateTo}`
        : new Date().toISOString().slice(0, 10);
    a.download = `returns_report_${suffix}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t('returnsModule.exportDone'));
  } catch (e) {
    toast.error(e?.response?.data?.message ?? t('returnsModule.exportFailed'));
  } finally {
    setExporting(false);
  }
}

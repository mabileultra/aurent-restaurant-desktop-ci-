import { isRowDuplicate, isRowInvalid } from '../../../utils/productImportUtils';

export const PRODUCT_IMPORT_TASNIF_TONES = ['found', 'partial', 'missing', 'duplicate', 'invalid', 'idle'];

/** Светофор строки импорта (как в аптеке). */
export function classifyProductImportTasnif(row, tasnif) {
  if (isRowDuplicate(row)) return 'duplicate';
  if (isRowInvalid(row)) return 'invalid';
  if (!tasnif || tasnif.status === 'idle' || tasnif.status === 'checking') return 'idle';
  if (tasnif.status === 'found') {
    if (tasnif.matchSource === 'name') return 'partial';
    return 'found';
  }
  return 'missing';
}

export function summarizeProductImportTasnif(rows, tasnifByRow) {
  const summary = { found: 0, partial: 0, missing: 0, duplicate: 0, invalid: 0, idle: 0, total: rows.length };
  for (const row of rows) {
    const tone = classifyProductImportTasnif(row, tasnifByRow?.[row.rowNum]);
    summary[tone] = (summary[tone] || 0) + 1;
  }
  return summary;
}

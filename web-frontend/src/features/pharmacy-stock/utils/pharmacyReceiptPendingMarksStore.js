/** Временное хранение КМ из Excel-импорта до скана/проведения на документе. */

const PREFIX = 'pharmacy-receipt-import-marks:v1:';

export function savePendingImportMarks(receiptId, rows) {
  if (!receiptId) return;
  const payload = (rows || [])
    .filter((row) => Array.isArray(row?.markCodes) && row.markCodes.length > 0)
    .map((row) => ({
      barcode: row.barcode || null,
      excelName: row.excelName || null,
      markCodes: row.markCodes.map((c) => String(c).trim()).filter(Boolean),
    }));
  try {
    if (!payload.length) {
      sessionStorage.removeItem(PREFIX + receiptId);
      return;
    }
    sessionStorage.setItem(PREFIX + receiptId, JSON.stringify(payload));
  } catch {
    // ignore quota / private mode
  }
}

export function takePendingImportMarks(receiptId) {
  if (!receiptId) return [];
  try {
    const raw = sessionStorage.getItem(PREFIX + receiptId);
    sessionStorage.removeItem(PREFIX + receiptId);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Сопоставить pending-строки импорта с линиями документа. */
export function matchPendingMarksToLines(lines = [], pending = []) {
  const byLineId = {};
  const used = new Set();
  for (const line of lines) {
    if (!line?.id) continue;
    const hitIndex = pending.findIndex((row, idx) => {
      if (used.has(idx)) return false;
      if (row.barcode && line.sku && String(row.barcode) === String(line.sku)) return true;
      if (row.barcode && line.barcode && String(row.barcode) === String(line.barcode)) return true;
      if (row.excelName && line.productName
        && String(row.excelName).trim().toLowerCase() === String(line.productName).trim().toLowerCase()) {
        return true;
      }
      return false;
    });
    if (hitIndex < 0) continue;
    used.add(hitIndex);
    const codes = pending[hitIndex].markCodes || [];
    byLineId[line.id] = codes.map((code) => ({ code, aslStatus: 'IMPORT' }));
  }
  return byLineId;
}

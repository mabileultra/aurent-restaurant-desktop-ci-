import { productApi } from '../../../api';
import { parseReceiptLinesCsv, receiptLineFromImportRow } from '../utils/receiptLinesCsv';

async function findProduct(query, storeId) {
  const q = String(query || '').trim();
  if (!q) return null;
  const { data } = await productApi.getAll({
    search: q,
    page: 0,
    size: 8,
    activeOnly: true,
    storeId: storeId ?? undefined,
  });
  const rows = data?.content ?? [];
  const lower = q.toLowerCase();
  const exact = rows.find(
    (p) =>
      String(p.sku || '').toLowerCase() === lower
      || String(p.barcode || '').toLowerCase() === lower
      || (p.barcodes || []).some((b) => String(b).toLowerCase() === lower)
      || String(p.name || '').toLowerCase() === lower,
  );
  return exact || rows[0] || null;
}

/**
 * Parse CSV text and resolve products. Returns { lines, matched, missed }.
 */
export async function importReceiptLinesFromCsv(text, storeId) {
  const rows = parseReceiptLinesCsv(text);
  const lines = [];
  let matched = 0;
  const missed = [];

  for (const row of rows) {
    const product = await findProduct(row.sku || row.name, storeId);
    if (product) {
      matched += 1;
      lines.push(receiptLineFromImportRow(row, product));
    } else {
      missed.push(row.sku || row.name);
      lines.push(receiptLineFromImportRow(row, null));
    }
  }

  return { lines, matched, missed, total: rows.length };
}

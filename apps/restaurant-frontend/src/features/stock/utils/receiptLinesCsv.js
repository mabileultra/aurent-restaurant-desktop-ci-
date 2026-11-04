import { emptyReceiptLine } from './stockDocumentFormUtils';

const HEADER = ['sku', 'name', 'quantity', 'purchasePrice', 'salePrice'];

function escapeCsv(value) {
  const s = String(value ?? '');
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function buildReceiptLinesCsv(lines) {
  const rows = [HEADER.join(',')];
  for (const line of lines) {
    if (!line.productId && !line.sku) continue;
    rows.push([
      escapeCsv(line.sku || ''),
      escapeCsv(line.productName || ''),
      escapeCsv(line.quantity ?? ''),
      escapeCsv(line.purchasePrice ?? ''),
      escapeCsv(line.unitSellingPrice ?? ''),
    ].join(','));
  }
  return `${rows.join('\n')}\n`;
}

export function downloadReceiptLinesCsv(lines, filenamePrefix = 'receipt_lines') {
  const csv = buildReceiptLinesCsv(lines);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filenamePrefix}_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadReceiptLinesTemplate() {
  const csv = `${HEADER.join(',')}\nSKU001,Coca-Cola 0.5,10,5000,7000\n`;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'receipt_lines_template.csv';
  a.click();
  URL.revokeObjectURL(url);
}

function parseCsvLine(line) {
  const out = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i += 1;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      out.push(cur.trim());
      cur = '';
    } else {
      cur += ch;
    }
  }
  out.push(cur.trim());
  return out;
}

/** @returns {{ sku: string, name: string, quantity: string, purchasePrice: string, salePrice: string }[]} */
export function parseReceiptLinesCsv(text) {
  const lines = String(text || '')
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return [];

  const header = parseCsvLine(lines[0]).map((h) => h.toLowerCase());
  const hasHeader = header.includes('sku') || header.includes('name') || header.includes('quantity');
  const start = hasHeader ? 1 : 0;
  const idx = (names) => {
    for (const n of names) {
      const i = header.indexOf(n);
      if (i >= 0) return i;
    }
    return -1;
  };

  const skuI = hasHeader ? idx(['sku', 'артикул']) : 0;
  const nameI = hasHeader ? idx(['name', 'название', 'product', 'товар']) : 1;
  const qtyI = hasHeader ? idx(['quantity', 'qty', 'кол-во', 'количество']) : 2;
  const buyI = hasHeader ? idx(['purchaseprice', 'purchase_price', 'buy', 'закупка', 'cost']) : 3;
  const saleI = hasHeader ? idx(['saleprice', 'sale_price', 'selling', 'цена', 'price']) : 4;

  const rows = [];
  for (let i = start; i < lines.length; i += 1) {
    const cols = parseCsvLine(lines[i]);
    const sku = skuI >= 0 ? cols[skuI] || '' : '';
    const name = nameI >= 0 ? cols[nameI] || '' : '';
    if (!sku && !name) continue;
    rows.push({
      sku,
      name,
      quantity: qtyI >= 0 ? (cols[qtyI] || '1') : '1',
      purchasePrice: buyI >= 0 ? (cols[buyI] || '') : '',
      salePrice: saleI >= 0 ? (cols[saleI] || '') : '',
    });
  }
  return rows;
}

export function receiptLineFromImportRow(row, product) {
  return {
    ...emptyReceiptLine(),
    productId: product?.id ?? '',
    productName: product?.name ?? row.name ?? '',
    sku: product?.sku ?? row.sku ?? '',
    quantity: row.quantity || '1',
    purchasePrice: row.purchasePrice || String(product?.costPrice ?? ''),
    unitSellingPrice: row.salePrice || String(product?.sellingPrice ?? product?.costPrice ?? ''),
  };
}

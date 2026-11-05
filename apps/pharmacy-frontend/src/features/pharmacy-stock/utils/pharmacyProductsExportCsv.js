import { productReceiptOrigin } from './productReceiptOrigin';
import {
  productCountry,
  productDosageForm,
  productManufacturer,
  productUnitsInPack,
} from './pharmacyReceiptPricing';

function csvEscape(value) {
  const s = value == null ? '' : String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function rowCells(p) {
  const origin = productReceiptOrigin(p);
  return [
    p.sku,
    p.name,
    origin.supplierName,
    origin.receiptNumber,
    origin.documentDate,
    p.stockQuantity ?? 0,
    p.costPrice,
    p.sellingPrice,
    p.barcode,
    p.ikpu,
    productManufacturer(p),
    productDosageForm(p),
    productCountry(p),
    productUnitsInPack(p) || 1,
    p.active === false ? 'inactive' : 'active',
    p.updatedAt || p.createdAt || '',
  ].map(csvEscape).join(',');
}

const HEADER = [
  'sku', 'name', 'supplier', 'receipt', 'date', 'qty', 'cost', 'retail',
  'barcode', 'ikpu', 'manufacturer', 'form', 'country', 'unitsInPack', 'status', 'updatedAt',
].join(',');

/** Скачать CSV по текущему списку товаров (уже загруженные строки). */
export function downloadPharmacyProductsCsv(rows, filename) {
  const body = [HEADER, ...(rows || []).map(rowCells)].join('\n');
  const blob = new Blob([`\uFEFF${body}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `pharmacy-products_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

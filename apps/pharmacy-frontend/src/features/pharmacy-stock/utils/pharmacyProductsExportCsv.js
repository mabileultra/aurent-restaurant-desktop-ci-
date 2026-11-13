import { productAttr } from '../../pharmacy-cashier/utils/pharmacyProductMeta';
import { productReceiptOrigin } from './productReceiptOrigin';
import { formatProductUpdatedAt } from './formatPharmacyProductUpdated';
import {
  productCountry,
  productDosageForm,
  productManufacturer,
  productUnitsInPack,
} from './pharmacyReceiptPricing';

function productAtc(product) {
  return productAttr(product, 'atc_code', 'atc', 'атх', 'atcCode');
}

/** Excel (RU/UZ) ждёт `;` как разделитель колонок — с `,` всё падает в столбец A. */
const SEP = ';';

function csvEscape(value) {
  const s = value == null || value === '' ? '' : String(value);
  if (s === '—') return '';
  if (/["\n\r;]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function cellOrEmpty(value) {
  if (value == null || value === '') return '';
  return value;
}

/** Заголовки как в таблице склада. */
export function pharmacyProductsExportHeaders(t) {
  return [
    '№',
    t('pharmacyStock.colName'),
    t('stockReports.colSupplier'),
    t('pharmacyStock.colDocNo'),
    t('pharmacyStock.colDate'),
    t('stockModule.colQty'),
    t('pharmacyStock.retailPrice'),
    t('pharmacyStock.colManufacturer'),
    t('pharmacyStock.colForm'),
    t('pharmacyStock.productAtc'),
    t('pharmacyStock.productBarcodes'),
    t('pharmacyStock.productMxik'),
    t('pharmacyStock.unitsInPack'),
    t('pharmacyStock.colCountry'),
    t('pharmacyStock.colUpdated'),
  ];
}

function rowCells(p, index) {
  const origin = productReceiptOrigin(p);
  return [
    index + 1,
    p.name,
    cellOrEmpty(origin.supplierName),
    cellOrEmpty(origin.receiptNumber),
    cellOrEmpty(origin.documentDate),
    p.stockQuantity ?? 0,
    p.sellingPrice,
    cellOrEmpty(productManufacturer(p)),
    cellOrEmpty(productDosageForm(p)),
    cellOrEmpty(productAtc(p)),
    cellOrEmpty(p.barcode),
    cellOrEmpty(p.ikpu),
    productUnitsInPack(p) || 1,
    cellOrEmpty(productCountry(p)),
    formatProductUpdatedAt(p.updatedAt || p.createdAt) || '',
  ].map(csvEscape).join(SEP);
}

/** Текст CSV (без BOM) — для тестов и скачивания. */
export function buildPharmacyProductsCsv(rows, t) {
  const header = pharmacyProductsExportHeaders(t).join(SEP);
  return [`sep=${SEP}`, header, ...(rows || []).map((row, i) => rowCells(row, i))].join('\r\n');
}

/** Скачать CSV по списку товаров. */
export function downloadPharmacyProductsCsv(rows, t, filename) {
  const blob = new Blob([`\uFEFF${buildPharmacyProductsCsv(rows, t)}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `pharmacy-products_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

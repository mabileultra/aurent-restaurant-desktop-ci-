import * as XLSX from 'xlsx';
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

function cellOrEmpty(value) {
  if (value == null || value === '' || value === '—') return '';
  return value;
}

/** Текст для штрихкода/ИКПУ — иначе Excel сжимает в 3E+15. */
function asCodeText(value) {
  if (value == null || value === '' || value === '—') return '';
  return String(value);
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

const BARCODE_COL = 10;
const IKPU_COL = 11;

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
    asCodeText(p.barcode),
    asCodeText(p.ikpu),
    productUnitsInPack(p) || 1,
    cellOrEmpty(productCountry(p)),
    formatProductUpdatedAt(p.updatedAt || p.createdAt) || '',
  ];
}

/** Строки листа: заголовок + товары. */
export function buildPharmacyProductsSheetRows(rows, t) {
  return [
    pharmacyProductsExportHeaders(t),
    ...(rows || []).map((row, i) => rowCells(row, i)),
  ];
}

function forceCodeColumnsAsText(ws, rowCount) {
  for (let r = 1; r < rowCount; r += 1) {
    for (const c of [BARCODE_COL, IKPU_COL]) {
      const addr = XLSX.utils.encode_cell({ r, c });
      const cell = ws[addr];
      if (!cell || cell.v == null || cell.v === '') continue;
      cell.t = 's';
      cell.v = String(cell.v);
      cell.z = '@';
    }
  }
}

/** Скачать .xlsx — UTF-8 и длинные коды не ломаются в Excel. */
export function downloadPharmacyProductsCsv(rows, t, filename) {
  const data = buildPharmacyProductsSheetRows(rows, t);
  const ws = XLSX.utils.aoa_to_sheet(data);
  forceCodeColumnsAsText(ws, data.length);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Products');
  XLSX.writeFile(
    wb,
    filename || `pharmacy-products_${new Date().toISOString().slice(0, 10)}.xlsx`,
  );
}

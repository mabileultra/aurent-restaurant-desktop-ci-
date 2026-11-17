import { lineDiscountAmount, lineSubtotal } from '../../store/cartStore';
import { toSum } from './multikassaMoney';
import { toOfdMarkingLabel } from '../fiscal/shared/ofdMarkingLabel';
import { resolveLinePackageCode } from '../fiscal/shared/resolveLinePackageCode';
import { resolveFiscalPackageName } from '../fiscal/shared/resolveFiscalPackageCodes';
import { transliterateCyrillicToLatin } from '../../utils/transliterateCyrillic';

export function numericProductId(productId) {
  if (productId == null) return 0;
  const asNum = Number(productId);
  if (Number.isFinite(asNum) && asNum > 0) return Math.trunc(asNum);
  const raw = String(productId).replace(/-/g, '');
  let h = 0;
  for (let i = 0; i < raw.length; i += 1) {
    h = (Math.imul(31, h) + raw.charCodeAt(i)) | 0;
  }
  return Math.abs(h) || 1;
}

export function lineMark(line) {
  if (line.productMark || line.markCode) return line.productMark || line.markCode;
  if (Array.isArray(line.productMarks) && line.productMarks[0]) return line.productMarks[0];
  return line.productLabel || '';
}

export function buildItem(line) {
  const barcode = line.barcode || line.sku || '';
  const mark = lineMark(line);
  const ofdLabel = toOfdMarkingLabel(mark) || toOfdMarkingLabel(line.productLabel) || '';
  const ikpu = line.ikpu != null && String(line.ikpu).trim() !== '' ? String(line.ikpu) : '';
  const classifier =
    (line.classifierClassCode && String(line.classifierClassCode).trim()) || ikpu;
  const price = toSum(line.unitPrice);
  const discount = toSum(lineDiscountAmount(line));
  const total = toSum(lineSubtotal(line));
  const barcodes = barcode
    ? [{ type: null, barcode: String(barcode) }]
    : [];
  const packageCode = resolveLinePackageCode(line);

  const item = {
    product_id: numericProductId(line.productId),
    classifier_class_code: classifier,
    product_name: transliterateCyrillicToLatin(line.name || 'Товар') || 'Tovar',
    product_barcode: barcode ? String(barcode) : '',
    no_check_mark: Boolean(line.noCheckMark),
    fixed_qty: Number(line.fixedQty) || 0,
    is_bottling: Boolean(line.isBottling),
    ikpu,
    packageCode,
    product_barcodes: barcodes,
    product_price: price,
    product_without_vat: Boolean(line.productWithoutVat),
    product_discount: discount,
    total_product_price: total,
    count: Number(line.quantity) || 0,
    commitent_tin: line.commissionTin || line.commitentTin || '',
    product_vat_percent: Number(line.taxRate ?? 12),
    // «1» фискальный модуль не принимает: это не код упаковки Tasnif.
    product_package: packageCode || (ikpu ? '' : '1'),
    product_package_name: transliterateCyrillicToLatin(resolveFiscalPackageName(line)),
    other: toSum(line.other || 0),
  };
  if (ofdLabel) {
    item.product_mark = ofdLabel;
    item.product_label = ofdLabel;
  }
  return item;
}

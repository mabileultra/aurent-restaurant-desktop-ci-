import { lineDiscountAmount, lineSubtotal } from '../../store/cartStore';
import { MULTIKASSA_OPERATION_TYPE } from './multikassaConstants';
import { formatMultikassaDateTime, toSum, toTiyin } from './multikassaMoney';

function numericProductId(productId) {
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

function buildItem(line) {
  const barcode = line.barcode || line.sku || '';
  const mark = line.productMark || line.markCode || '';
  const label = line.productLabel || '';
  // Маркировка — без обрезки (как со сканера).
  const productMark = mark;
  const price = toSum(line.unitPrice);
  const discount = toSum(lineDiscountAmount(line));
  const total = toSum(lineSubtotal(line));
  const barcodes = barcode
    ? [{ type: null, barcode: String(barcode) }]
    : [];

  return {
    product_id: numericProductId(line.productId),
    classifier_class_code: line.classifierClassCode || '',
    product_mark: productMark,
    product_label: label,
    product_name: line.name || 'Товар',
    product_barcode: barcode ? String(barcode) : '',
    no_check_mark: Boolean(line.noCheckMark),
    fixed_qty: Number(line.fixedQty) || 0,
    is_bottling: Boolean(line.isBottling),
    ikpu: line.ikpu != null ? String(line.ikpu) : '',
    packageCode: line.packageCode != null ? String(line.packageCode) : '',
    product_barcodes: barcodes,
    product_price: price,
    product_without_vat: Boolean(line.productWithoutVat),
    product_discount: discount,
    total_product_price: total,
    count: Number(line.quantity) || 0,
    commitent_tin: line.commissionTin || line.commitentTin || '',
    product_vat_percent: Number(line.taxRate ?? 12),
    product_package: line.unitMeasureCode || '1',
    product_package_name: line.unitOfMeasure || line.unitLabel || 'шт',
    other: toSum(line.other || 0),
  };
}

function resolveOperationType(receiptType) {
  const rt = String(receiptType || 'SALE').toUpperCase();
  if (rt === 'ADVANCE') return MULTIKASSA_OPERATION_TYPE.ADVANCE;
  if (rt === 'CREDIT') return MULTIKASSA_OPERATION_TYPE.CREDIT;
  return MULTIKASSA_OPERATION_TYPE.SALE;
}

/**
 * Body продажи / аванса / кредита для POST /api/v1/operations.
 */
export function buildSaleOperationBody({
  cartItems,
  payment,
  total,
  capabilities,
  shiftId,
  cashierName,
  contractorName,
}) {
  const cash = Number(payment?.cashAmount ?? (payment?.paymentMethod === 'CASH' ? total : 0)) || 0;
  const card = Number(payment?.cardAmount ?? (payment?.paymentMethod === 'CARD' ? total : 0)) || 0;
  const terminalId = capabilities?.terminalId || '';
  const now = formatMultikassaDateTime();
  const opType = resolveOperationType(payment?.receiptType);

  const body = {
    module_operation_type: opType,
    receipt_sum: toTiyin(total),
    receipt_gnk_terminalid: terminalId,
    module_gnk_terminalid: terminalId,
    receipt_cashier_name: capabilities?.cashierNameOverride || cashierName || 'CASHIER',
    receipt_gnk_receivedcash: toTiyin(cash),
    receipt_gnk_receivedcard: toTiyin(card),
    receipt_gnk_time: now,
    shift_id: shiftId ? String(shiftId) : '',
    items: (cartItems || []).map(buildItem),
  };

  const contractor = String(contractorName || '').trim();
  if (contractor) {
    body.contractor_name = contractor;
  }

  if (opType === MULTIKASSA_OPERATION_TYPE.ADVANCE || opType === MULTIKASSA_OPERATION_TYPE.CREDIT) {
    const paid = card !== 0 ? toTiyin(card) : toTiyin(cash);
    const isAdvance = opType === MULTIKASSA_OPERATION_TYPE.ADVANCE;
    body.payment = {
      avansed: isAdvance ? paid : 0,
      paid,
      receipt_gnk_fiscalsign: '',
      total_sum: toTiyin(total),
      credited: isAdvance ? 0 : paid,
      receipt_gnk_receiptseq: 0,
      type: isAdvance ? 'avance' : 'credit',
    };
  }

  return body;
}

export function buildOpenShiftBody({ capabilities, shiftId, cashierName, zReportNumber }) {
  const now = formatMultikassaDateTime();
  const terminalId = capabilities?.terminalId || '';
  return {
    module_operation_type: MULTIKASSA_OPERATION_TYPE.OPEN_SHIFT,
    receipt_gnk_time: now,
    receipt_cashier_name: capabilities?.cashierNameOverride || cashierName || 'CASHIER',
    receipt_gnk_terminalid: terminalId,
    shift_id: shiftId ? String(shiftId) : '',
    module_gnk_id: capabilities?.moduleNumber || '',
    receipt_gnk_receiptseq: zReportNumber != null ? String(zReportNumber) : '0',
    receipt_gnk_datetime: now,
  };
}

export function buildCloseShiftBody(args) {
  return {
    ...buildOpenShiftBody(args),
    module_operation_type: MULTIKASSA_OPERATION_TYPE.CLOSE_SHIFT,
  };
}

export function buildXReportBody({ capabilities, cashierName }) {
  return {
    module_operation_type: MULTIKASSA_OPERATION_TYPE.X_REPORT,
    receipt_cashier_name: capabilities?.cashierNameOverride || cashierName || 'CASHIER',
    receipt_gnk_time: formatMultikassaDateTime(),
  };
}

export function buildRefundBody({ receiptSaleId }) {
  const id = String(receiptSaleId || '');
  return {
    module_operation_type: MULTIKASSA_OPERATION_TYPE.REFUND,
    receipt_sale_id: id,
    RefundInfo: { ReceiptSaleId: id },
  };
}

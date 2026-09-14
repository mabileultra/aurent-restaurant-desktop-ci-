import { lineDiscountAmount, lineSubtotal } from '../../store/cartStore';
import { MULTIKASSA_OPERATION_TYPE } from './multikassaConstants';
import { formatMultikassaDateTime, toSum, toTiyin } from './multikassaMoney';
import { round2 } from '../../utils/taxAmounts';

/** Если в настройках случайно сохранили YZ+YZ — вернуть одну половину. */
export function normalizeGnkTerminalId(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  const half = Math.floor(raw.length / 2);
  if (half >= 8 && raw.length === half * 2 && raw.slice(0, half) === raw.slice(half)) {
    return raw.slice(0, half);
  }
  return raw;
}

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

/** Наличные / карта по доке Multikassa (тийины считаются снаружи). */
export function resolveReceivedCashCard(payment, total) {
  const method = String(payment?.paymentMethod || 'CASH').toUpperCase();
  const due = round2(total);
  let cash = Number(payment?.cashAmount);
  let card = Number(payment?.cardAmount);
  if (!Number.isFinite(cash) || cash < 0) cash = 0;
  if (!Number.isFinite(card) || card < 0) card = 0;

  if (method === 'CASH') {
    if (cash <= 0 && card <= 0) cash = due;
  } else if (method === 'CARD' || method === 'CASHLESS' || method === 'MPESA') {
    if (cash <= 0 && card <= 0) card = due;
  } else if (method === 'MIXED') {
    if (cash > 0 && card <= 0) card = round2(Math.max(0, due - cash));
    else if (card > 0 && cash <= 0) cash = round2(Math.max(0, due - card));
  }

  return { cash: round2(cash), card: round2(card) };
}

function buildItem(line) {
  const barcode = line.barcode || line.sku || '';
  const mark = line.productMark || line.markCode || '';
  const label = line.productLabel || '';
  const ikpu = line.ikpu != null && String(line.ikpu).trim() !== '' ? String(line.ikpu) : '';
  const classifier =
    (line.classifierClassCode && String(line.classifierClassCode).trim()) || ikpu;
  const price = toSum(line.unitPrice);
  const discount = toSum(lineDiscountAmount(line));
  const total = toSum(lineSubtotal(line));
  const barcodes = barcode
    ? [{ type: null, barcode: String(barcode) }]
    : [];

  return {
    product_id: numericProductId(line.productId),
    classifier_class_code: classifier,
    product_mark: mark,
    product_label: label,
    product_name: line.name || 'Товар',
    product_barcode: barcode ? String(barcode) : '',
    no_check_mark: Boolean(line.noCheckMark),
    fixed_qty: Number(line.fixedQty) || 0,
    is_bottling: Boolean(line.isBottling),
    ikpu,
    packageCode: line.packageCode != null ? String(line.packageCode) : '',
    product_barcodes: barcodes,
    product_price: price,
    product_without_vat: Boolean(line.productWithoutVat),
    product_discount: discount,
    total_product_price: total,
    count: Number(line.quantity) || 0,
    commitent_tin: line.commissionTin || line.commitentTin || '',
    product_vat_percent: Number(line.taxRate ?? 12),
    // Multikassa: product_package = код упаковки Tasnif (не unitMeasureCode «1» шт/кг)
    product_package:
      (line.packageCode != null && String(line.packageCode).trim() !== ''
        ? String(line.packageCode).trim()
        : '') ||
      (line.unitMeasureCode != null && String(line.unitMeasureCode).trim() !== ''
        ? String(line.unitMeasureCode).trim()
        : '') ||
      '1',
    product_package_name:
      line.packageName || line.unitOfMeasure || line.unitLabel || 'шт',
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
 * Body продажи / аванса / кредита для POST /api/v1/operations (док Multikassa).
 * receipt_* money → тийины; items prices → сумы.
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
  const due = round2(total);
  const { cash, card } = resolveReceivedCashCard(payment, due);
  const terminalId = normalizeGnkTerminalId(capabilities?.terminalId);
  const now = formatMultikassaDateTime();
  const opType = resolveOperationType(payment?.receiptType);

  const body = {
    module_operation_type: opType,
    receipt_sum: toTiyin(due),
    receipt_gnk_terminalid: terminalId,
    module_gnk_terminalid: terminalId,
    receipt_cashier_name: capabilities?.cashierNameOverride || cashierName || 'CASHIER',
    receipt_gnk_receivedcash: toTiyin(cash),
    receipt_gnk_receivedcard: toTiyin(card),
    receipt_gnk_time: now,
    shift_id: shiftId ? String(shiftId) : '',
    // Печать чека делает Aurent (ESC/POS). Без этого MK Fiscal падает: «Принтер не найден».
    force_to_print: false,
    items: (cartItems || []).map(buildItem),
    location: {
      Latitude: Number(capabilities?.latitude) || 41.3111,
      Longitude: Number(capabilities?.longitude) || 69.2797,
    },
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
      total_sum: toTiyin(due),
      credited: isAdvance ? 0 : paid,
      receipt_gnk_receiptseq: 0,
      type: isAdvance ? 'avance' : 'credit',
    };
  }

  return body;
}

export function buildOpenShiftBody({ capabilities, shiftId, cashierName, zReportNumber }) {
  const now = formatMultikassaDateTime();
  const terminalId = normalizeGnkTerminalId(capabilities?.terminalId);
  return {
    module_operation_type: MULTIKASSA_OPERATION_TYPE.OPEN_SHIFT,
    receipt_gnk_time: now,
    receipt_cashier_name: capabilities?.cashierNameOverride || cashierName || 'CASHIER',
    receipt_gnk_terminalid: terminalId,
    shift_id: shiftId ? String(shiftId) : '',
    module_gnk_id: normalizeGnkTerminalId(capabilities?.moduleNumber) || terminalId,
    receipt_gnk_receiptseq: zReportNumber != null ? String(zReportNumber) : '0',
    receipt_gnk_datetime: now,
    force_to_print: false,
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
    force_to_print: false,
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

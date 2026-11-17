import { buildMultikassaCardFields } from '@aurent/shared-fiscal';
import { MULTIKASSA_OPERATION_TYPE } from './multikassaConstants';
import { formatMultikassaDateTime, toTiyin } from './multikassaMoney';
import { resolveReceivedCashCard } from '../fiscal/shared/resolveReceivedCashCard';
import { round2 } from '../../utils/taxAmounts';
import { transliterateCyrillicToLatin } from '../../utils/transliterateCyrillic';
import { buildItem } from './multikassaOperationItem';

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

export { resolveReceivedCashCard };

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
    receipt_cashier_name: transliterateCyrillicToLatin(
      capabilities?.cashierNameOverride || cashierName || 'CASHIER',
    ),
    receipt_gnk_receivedcash: toTiyin(cash),
    receipt_gnk_receivedcard: toTiyin(card),
    ...buildMultikassaCardFields(payment, card),
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

  const contractor = transliterateCyrillicToLatin(String(contractorName || '').trim());
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
    receipt_cashier_name: transliterateCyrillicToLatin(
      capabilities?.cashierNameOverride || cashierName || 'CASHIER',
    ),
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
    receipt_cashier_name: transliterateCyrillicToLatin(
      capabilities?.cashierNameOverride || cashierName || 'CASHIER',
    ),
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

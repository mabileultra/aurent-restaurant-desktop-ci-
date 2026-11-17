import { lineSubtotal } from '../../../../store/cartStore';
import { formatFiscalDateTime, toFiscalRefundDateTime, toTiyin } from '../../shared/fiscalMoney';
import { resolveReceivedCashCard } from '../../shared/resolveReceivedCashCard';
import { buildFiscalDriveItem } from './buildFiscalDriveItem';
import {
  FD_DEFAULT_LOCATION,
  FD_OPERATION,
  FD_PAYMENT_TYPE,
  FD_RECEIPT_TYPE,
} from './fiscalDriveConstants';

function resolveReceiptType(receiptType) {
  const rt = String(receiptType || 'SALE').toUpperCase();
  if (rt === 'ADVANCE') return FD_RECEIPT_TYPE.ADVANCE;
  if (rt === 'CREDIT') return FD_RECEIPT_TYPE.CREDIT;
  return FD_RECEIPT_TYPE.PURCHASE;
}

function resolvePaymentType(cashTiyin, cardTiyin) {
  if (cashTiyin > 0 && cardTiyin > 0) return FD_PAYMENT_TYPE.MIXED;
  if (cardTiyin > 0) return FD_PAYMENT_TYPE.CARD;
  return FD_PAYMENT_TYPE.CASH;
}

/**
 * Скидка на весь заказ (сумма строк − итог) раскладывается по строкам пропорционально,
 * остаток от округления — на последнюю строку с суммой.
 */
function splitOrderDiscount(cartItems, total) {
  const subtotals = cartItems.map((line) => toTiyin(lineSubtotal(line)));
  const linesTotal = subtotals.reduce((acc, v) => acc + v, 0);
  const orderDiscount = Math.min(linesTotal, Math.max(0, linesTotal - toTiyin(total)));
  if (orderDiscount === 0 || linesTotal === 0) return subtotals.map(() => 0);

  const shares = subtotals.map((v) => Math.floor((orderDiscount * v) / linesTotal));
  let rest = orderDiscount - shares.reduce((acc, v) => acc + v, 0);
  for (let i = shares.length - 1; i >= 0 && rest > 0; i -= 1) {
    const room = subtotals[i] - shares[i];
    const add = Math.min(room, rest);
    shares[i] += add;
    rest -= add;
  }
  return shares;
}

function resolveLocation(capabilities) {
  const lat = Number(capabilities?.latitude);
  const lon = Number(capabilities?.longitude);
  return {
    Latitude: Number.isFinite(lat) && lat !== 0 ? lat : FD_DEFAULT_LOCATION.Latitude,
    Longitude: Number.isFinite(lon) && lon !== 0 ? lon : FD_DEFAULT_LOCATION.Longitude,
  };
}

/**
 * Корзина кассы → JSON-чек FiscalDriveService (/FiscalDrive/Receipt/GetTXID).
 * refundInfo — данные исходного чека для возврата (Operation = 1).
 */
export function buildFiscalDriveReceipt({
  cartItems,
  payment,
  total,
  capabilities,
  refundInfo = null,
  now = new Date(),
}) {
  const lines = cartItems || [];
  const { cash, card } = resolveReceivedCashCard(payment, total);
  const receivedCash = toTiyin(cash);
  const receivedCard = toTiyin(card);
  const discounts = splitOrderDiscount(lines, total);

  const refundDateTime = toFiscalRefundDateTime(refundInfo?.dateTime);
  const refundTerminalId = String(refundInfo?.terminalId || '').trim();
  const refundFiscalSign = String(refundInfo?.fiscalSign || '').trim();
  const refundSeq = Number(refundInfo?.receiptSeq) || 0;
  const refund = refundInfo && refundDateTime && refundTerminalId && refundFiscalSign && refundSeq > 0
    ? {
      TerminalID: refundTerminalId,
      ReceiptSeq: refundSeq,
      DateTime: refundDateTime,
      FiscalSign: refundFiscalSign,
    }
    : null;

  const receipt = {
    Time: formatFiscalDateTime(now),
    ReceivedCash: receivedCash,
    ReceivedCard: receivedCard,
    Type: resolveReceiptType(payment?.receiptType),
    Operation: refund ? FD_OPERATION.REFUND : FD_OPERATION.SALE,
    PaymentType: resolvePaymentType(receivedCash, receivedCard),
    Location: resolveLocation(capabilities),
    Items: lines.map((line, i) => buildFiscalDriveItem(line, { extraDiscountTiyin: discounts[i] })),
  };

  if (refund) receipt.RefundInfo = refund;

  return receipt;
}

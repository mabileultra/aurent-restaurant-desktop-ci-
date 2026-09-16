import { buildFiscalSign, resolveReceiptQrValue } from './fiscalReceiptFormat';
import { isOfdCheckUrl, parseOfdCheckParams } from './ofdQrUrl';

function trim(value) {
  return String(value || '').trim();
}

function looksLikePlaceholderRegister(value) {
  const n = trim(value);
  if (!n) return true;
  return n === '1' || n === '001' || n === '000';
}

/**
 * Фискальный блок и QR для чека Aurent: только данные ГНК / ofd.soliq.uz.
 */
export function resolveFiscalReceiptMeta(sale, branding = {}) {
  const qrParts = parseOfdCheckParams(sale?.fiscalQrUrl);
  const qrValue = resolveReceiptQrValue(sale);
  const taxQr = isOfdCheckUrl(qrValue) ? qrValue : '';
  const fmNumber =
    trim(sale?.fiscalTerminalId) ||
    trim(qrParts?.terminalId) ||
    trim(branding.fmNumber);
  const fiscalReceiptNo = trim(sale?.fiscalReceiptSeq) || trim(qrParts?.receiptSeq);
  const fiscalSign = buildFiscalSign(sale);
  const virtualRegister = !looksLikePlaceholderRegister(branding.virtualRegister)
    ? trim(branding.virtualRegister)
    : trim(sale?.fiscalVirtualSn);

  return {
    qrValue: taxQr,
    fmNumber,
    fiscalReceiptNo,
    fiscalSign,
    virtualRegister,
  };
}

/**
 * Наличные / карта: явные суммы важнее paymentMethod (иначе чек врёт «Наличные»).
 */
export function resolveReceiptPaymentAmounts(sale) {
  const method = String(sale?.paymentMethod || 'CASH').toUpperCase();
  const total = Number(sale?.totalAmount) || 0;
  const cashExplicit = Number(sale?.cashAmount);
  const cardExplicit = Number(sale?.cardAmount);
  const hasCash = Number.isFinite(cashExplicit) && cashExplicit > 0;
  const hasCard = Number.isFinite(cardExplicit) && cardExplicit > 0;

  if (hasCash || hasCard) {
    return {
      cashAmt: hasCash ? cashExplicit : 0,
      cardAmt: hasCard ? cardExplicit : 0,
      paidTotal: (hasCash ? cashExplicit : 0) + (hasCard ? cardExplicit : 0) || total,
      change: Number(sale?.changeGiven) || 0,
      method,
    };
  }

  const cashAmt =
    method === 'CASH'
      ? Number(sale?.amountTendered) || total
      : method === 'MIXED'
        ? 0
        : 0;
  const cardAmt =
    method === 'CARD' || method === 'CASHLESS' || method === 'MPESA'
      ? Number(sale?.amountTendered) || total
      : 0;

  return {
    cashAmt,
    cardAmt,
    paidTotal: method === 'CASH' ? Number(sale?.amountTendered) || total : total,
    change: Number(sale?.changeGiven) || 0,
    method,
  };
}

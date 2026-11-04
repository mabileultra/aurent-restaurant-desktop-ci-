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

export { resolveReceiptPaymentAmounts } from './resolveReceiptPaymentAmounts';

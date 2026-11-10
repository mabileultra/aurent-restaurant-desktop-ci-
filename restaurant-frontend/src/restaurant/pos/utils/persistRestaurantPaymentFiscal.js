import { rstPaymentApi } from '../../api/payment.api';
import { FISCAL_STATUS } from '../../../services/fiscal';

/**
 * Persist Multikassa proof on the payment row — never send QR URL.
 * Soft-fail: pay UX must not break if attach fails.
 */
export function toPaymentFiscalPayload(fiscal) {
  if (!fiscal) return null;
  const status = String(fiscal.fiscalStatus || '').toUpperCase();
  if (!status || status === 'NOT_REQUIRED') return null;
  const hasProof = Boolean(
    fiscal.fiscalSign
      || fiscal.fiscalReceiptSeq
      || fiscal.multikassaSaleId
      || fiscal.fiscalTerminalId
      || status === FISCAL_STATUS.FISCALIZED
      || status === FISCAL_STATUS.PENDING,
  );
  if (!hasProof) return null;
  return {
    fiscalStatus: status,
    fiscalSign: fiscal.fiscalSign || null,
    fiscalReceiptSeq: fiscal.fiscalReceiptSeq || null,
    multikassaSaleId: fiscal.multikassaSaleId || null,
    fiscalTerminalId: fiscal.fiscalTerminalId || fiscal.terminalId || null,
  };
}

export async function persistRestaurantPaymentFiscal(orderId, fiscal) {
  const payload = toPaymentFiscalPayload(fiscal);
  if (!orderId || !payload) return null;
  try {
    const res = await rstPaymentApi.attachFiscal(orderId, payload);
    return res?.data ?? null;
  } catch {
    return null;
  }
}

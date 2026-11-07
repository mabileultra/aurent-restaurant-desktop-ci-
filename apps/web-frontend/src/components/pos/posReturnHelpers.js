import { isPharmacyErrorCode } from '../../pharmacy/errors/isPharmacyErrorCode';
import { resolvePharmacyApiError } from '../../pharmacy/errors/resolvePharmacyApiError';
import { getApiErrorCode } from '../../utils/apiError';

export const RECEIPT_LOOKUP_DEBOUNCE_MS = 450;

/**
 * Chek qidiruvidagi xatoliklarni tahlil qilish va xabarni shakllantirish
 */
export function parseLookupError(err, t) {
  if (isPharmacyErrorCode(getApiErrorCode(err))) {
    const pharmacyMsg = resolvePharmacyApiError(err, t, '');
    if (pharmacyMsg) return pharmacyMsg;
  }
  const status = err?.response?.status;
  const msg = err?.response?.data?.message ?? '';
  if (status === 403 || /access denied|доступ/i.test(msg)) {
    return t('pos.returnAccessDenied');
  }
  if (status === 404 || /not found|не найден/i.test(msg)) {
    return t('pos.returnNotFound');
  }
  return msg || t('pos.returnNotFound');
}

/**
 * To'lov turining foydalanuvchiga ko'rinadigan matnini qaytaradi
 */
export function paymentLabel(method, t) {
  switch (method) {
    case 'CASH':
      return t('pos.payCash');
    case 'CARD':
      return t('pos.payCard');
    case 'CASHLESS':
      return t('pos.payCashless');
    case 'MIXED':
      return t('pos.payMixed');
    case 'MPESA':
      return 'M-Pesa';
    default:
      return method || '—';
  }
}

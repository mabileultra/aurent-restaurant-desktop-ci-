import { resolvePharmacyApiError } from '../../pharmacy/errors/resolvePharmacyApiError';
import { isPharmacyErrorCode } from '../../pharmacy/errors/isPharmacyErrorCode';
import { getApiErrorCode } from '../../utils/apiError';

export function parseReturnLookupError(err, t) {
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

export function clampReturnQtyToMarks(qtyByItemId, marks) {
  if (!marks) return qtyByItemId;
  const next = { ...qtyByItemId };
  for (const [id, list] of Object.entries(marks)) {
    if (list?.length && (next[id] || 0) > list.length) next[id] = list.length;
  }
  return next;
}

export function returnPaymentLabel(method, t) {
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

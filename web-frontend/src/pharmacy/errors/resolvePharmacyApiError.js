import { getApiErrorCode, getApiErrorMessage } from '../../utils/apiError';
import { isPharmacyErrorCode } from './isPharmacyErrorCode';

const KEY_PREFIX = 'pharmacyErrors.';

/**
 * Сообщение для toast: i18n по PHARM_* → текст бэкенда → fallback ключ экрана.
 */
export function resolvePharmacyApiError(error, t, fallbackKey = 'pharmacyStock.saveFailed') {
  const code = getApiErrorCode(error);
  if (isPharmacyErrorCode(code)) {
    const translated = t(`${KEY_PREFIX}${code}`, { defaultValue: '' });
    if (translated) return translated;
  }
  const apiMsg = getApiErrorMessage(error, '');
  if (apiMsg) return apiMsg;
  if (!fallbackKey) return '';
  return t(fallbackKey);
}

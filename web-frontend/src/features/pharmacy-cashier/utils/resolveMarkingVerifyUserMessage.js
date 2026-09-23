import { getApiErrorMessage } from '../../../utils/apiError';

/**
 * ASL выключена / нет ключа на бэке (даже если FE думает, что включена).
 */
export function isAslIntegrationDisabledError(error) {
  const msg = String(getApiErrorMessage(error, '') || error?.message || '').toLowerCase();
  if (!msg) return false;
  return msg.includes('marking is disabled')
    || msg.includes('asl belgesi marking is disabled')
    || msg.includes('api key')
    || msg.includes('api-ключ')
    || msg.includes('not configured')
    || msg.includes('не настроен');
}

/**
 * Одно понятное сообщение для проверки КМ — без сырого текста API.
 *
 * @returns {'no-integration' | 'catalog-miss' | 'not-found' | 'verify-failed'}
 */
export function classifyMarkingVerifyFailure({
  aslEnabled = false,
  aslResult = null,
  aslError = null,
} = {}) {
  if (!aslEnabled || isAslIntegrationDisabledError(aslError)) {
    return 'no-integration';
  }
  if (aslResult?.found && aslResult.productName) {
    return 'catalog-miss';
  }
  if (aslResult && aslResult.found === false) {
    return 'not-found';
  }
  if (aslError && !isAslIntegrationDisabledError(aslError)) {
    // Сеть / 5xx — всё равно говорим «не найден», без технического дампа
    return 'not-found';
  }
  return 'not-found';
}

/**
 * i18n-текст для toast / списка отказов при проверке маркировки.
 */
export function resolveMarkingVerifyUserMessage({
  aslEnabled = false,
  aslResult = null,
  aslError = null,
  t,
  keys = {},
} = {}) {
  const kind = classifyMarkingVerifyFailure({ aslEnabled, aslResult, aslError });
  const {
    noIntegration = 'pharmacyCashier.integrations.markingApiDisabled',
    catalogMiss = 'pharmacyCashier.integrations.markingCatalogMiss',
    notFound = 'pharmacyCashier.integrations.markingCatalogNeed',
    verifyFailed = 'pharmacyCashier.integrations.markingNotFound',
  } = keys;

  if (kind === 'no-integration') {
    return t(noIntegration);
  }
  if (kind === 'catalog-miss') {
    return t(catalogMiss, { name: aslResult.productName });
  }
  if (kind === 'verify-failed') {
    return t(verifyFailed);
  }
  return t(notFound);
}

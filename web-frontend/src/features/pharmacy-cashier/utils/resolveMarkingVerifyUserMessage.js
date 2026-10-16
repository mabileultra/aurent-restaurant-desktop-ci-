import { getApiErrorMessage } from '../../../utils/apiError';

function aslErrorText(error) {
  return String(getApiErrorMessage(error, '') || error?.message || '').toLowerCase();
}

/**
 * Ключ сохранён, но ASL вернул 401/403 («не принял API-ключ»).
 * Не путать с «ключа нет в настройках».
 */
export function isAslApiKeyRejectedError(error) {
  const msg = aslErrorText(error);
  if (!msg) return false;
  return msg.includes('не принял api-ключ')
    || msg.includes('не принял api ключ')
    || msg.includes('rejected api key')
    || msg.includes('invalid api key')
    || msg.includes('bearer apikey бизнес')
    || (msg.includes('api-ключ') && (msg.includes('не принял') || msg.includes('open api')));
}

/**
 * ASL выключена / нет ключа на бэке (даже если FE думает, что включена).
 */
export function isAslIntegrationDisabledError(error) {
  if (isAslApiKeyRejectedError(error)) return false;
  const msg = aslErrorText(error);
  if (!msg) return false;
  return msg.includes('marking is disabled')
    || msg.includes('asl belgesi marking is disabled')
    || msg.includes('укажите api-ключ')
    || msg.includes('укажите api ключ')
    || msg.includes('not configured')
    || msg.includes('не настроен');
}

/**
 * Одно понятное сообщение для проверки КМ — без сырого текста API.
 *
 * @returns {'no-integration' | 'bad-api-key' | 'catalog-miss' | 'not-found' | 'verify-failed'}
 */
export function classifyMarkingVerifyFailure({
  aslEnabled = false,
  aslResult = null,
  aslError = null,
} = {}) {
  if (isAslApiKeyRejectedError(aslError)) {
    return 'bad-api-key';
  }
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
    badApiKey = 'pharmacyCashier.integrations.markingApiKeyRejected',
    catalogMiss = 'pharmacyCashier.integrations.markingCatalogMiss',
    notFound = 'pharmacyCashier.integrations.markingCatalogNeed',
    verifyFailed = 'pharmacyCashier.integrations.markingNotFound',
  } = keys;

  if (kind === 'no-integration') {
    return t(noIntegration);
  }
  if (kind === 'bad-api-key') {
    return t(badApiKey);
  }
  if (kind === 'catalog-miss') {
    return t(catalogMiss, { name: aslResult.productName });
  }
  if (kind === 'verify-failed') {
    return t(verifyFailed);
  }
  return t(notFound);
}

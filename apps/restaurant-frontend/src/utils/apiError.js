import toast from 'react-hot-toast';

const GENERIC_API_MESSAGES = new Set([
  'Validation failed',
  'An unexpected error occurred',
  'Internal error',
  'Internal Server Error',
  'Network Error',
  'Request failed',
]);

function firstFromErrors(errors) {
  if (!errors) return '';
  if (Array.isArray(errors)) {
    for (const item of errors) {
      if (typeof item === 'string' && item.trim()) return item.trim();
      if (item && typeof item.message === 'string' && item.message.trim()) {
        return item.message.trim();
      }
    }
    return '';
  }
  if (typeof errors === 'object') {
    const parts = Object.entries(errors)
      .filter(([, value]) => typeof value === 'string' && value.trim())
      .map(([field, value]) => `${field}: ${value.trim()}`);
    if (parts.length) return parts.join('; ');
  }
  return '';
}

function isGenericMessage(message) {
  if (!message) return true;
  return GENERIC_API_MESSAGES.has(message);
}

/**
 * Сообщение об ошибке из ответа API (ApiErrorResponse + ValidationErrorResponse.errors).
 */
export function getApiErrorMessage(error, fallback = '') {
  const data = error?.response?.data;
  const fieldMsg = firstFromErrors(data?.errors);
  const apiMsg = typeof data?.message === 'string' ? data.message.trim() : '';
  const code = data?.code;

  if (fieldMsg && (isGenericMessage(apiMsg) || code === 'VALIDATION_FAILED')) {
    return fieldMsg;
  }
  if (apiMsg && !isGenericMessage(apiMsg)) {
    return apiMsg;
  }
  if (fieldMsg) {
    return fieldMsg;
  }
  if (apiMsg) {
    return apiMsg;
  }

  const networkOrAxios = typeof error?.message === 'string' ? error.message.trim() : '';
  if (networkOrAxios && !isGenericMessage(networkOrAxios) && !error?.response) {
    return networkOrAxios;
  }

  return fallback || '';
}

/** Код ошибки: BAD_REQUEST, NOT_FOUND, CONFLICT, INTERNAL_ERROR, … */
export function getApiErrorCode(error) {
  return error?.response?.data?.code ?? null;
}

/** Контекст (только если backend включил app.errors.include-context) */
export function getApiErrorContext(error) {
  const ctx = error?.response?.data?.context;
  return ctx && typeof ctx === 'object' ? ctx : null;
}

/**
 * Toast с текстом бэкенда (поля валидации / message) либо локальный fallback.
 */
export function toastApiError(error, fallback) {
  toast.error(getApiErrorMessage(error, fallback));
}

const GENERIC_SERVER_ERROR = 'An unexpected error occurred';

/** Сообщение для экранов входа (касса / админка) — без сырого английского INTERNAL_ERROR. */
export function resolveAuthErrorMessage(error, t) {
  if (!error?.response) {
    return t('login.networkError');
  }
  const status = error.response.status;
  const apiMsg = getApiErrorMessage(error, '');
  if (status === 502 || status === 503 || status === 504) {
    return t('login.serviceUnavailable');
  }
  if (apiMsg === GENERIC_SERVER_ERROR || error.response?.data?.code === 'INTERNAL_ERROR') {
    return t('login.serverError');
  }
  if (apiMsg === 'Invalid PIN') {
    return t('login.badPin', { defaultValue: 'Неверный PIN' });
  }
  if (apiMsg === 'Invalid company code') {
    return t('login.badCompanyCode');
  }
  if (apiMsg) {
    return apiMsg;
  }
  return t('login.failed');
}

/** Для dev: полная строка code + message + context */
export function formatApiErrorForLog(error) {
  const code = getApiErrorCode(error);
  const msg = getApiErrorMessage(error, '');
  const ctx = getApiErrorContext(error);
  const parts = [code, msg].filter(Boolean);
  if (ctx && Object.keys(ctx).length > 0) {
    parts.push(JSON.stringify(ctx));
  }
  return parts.join(' | ') || String(error);
}

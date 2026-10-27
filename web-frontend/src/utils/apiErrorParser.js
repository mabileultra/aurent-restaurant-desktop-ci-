import i18n from 'i18next';
import { isApiNetworkError } from './apiNetworkError';

/**
 * Generates a short, readable reference code (e.g. "#ERR-500-4F2A") for tracking.
 */
export function buildErrorReferenceCode(status, error) {
  if (error?.response?.data?.referenceId) return String(error.response.data.referenceId);
  if (error?.response?.data?.traceId) return String(error.response.data.traceId).slice(0, 10);
  if (error?.response?.headers?.['x-request-id']) return String(error.response.headers['x-request-id']).slice(0, 10);

  const prefix = status ? `ERR-${status}` : 'ERR-NET';
  const str = String(error?.message || error?.config?.url || Date.now());
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).toUpperCase().padStart(4, '0').slice(-4);
  return `#${prefix}-${hex}`;
}

/**
 * Extracts validation field errors from backend responses (e.g. Spring Boot / Express).
 * Supports:
 * - { errors: { email: "Invalid", name: ["Required"] } }
 * - { errors: [ { field: "email", defaultMessage: "Invalid" } ] }
 */
export function extractFieldErrors(data) {
  if (!data || typeof data !== 'object') return null;
  const errors = data.errors || data.fieldErrors || data.validationErrors;
  if (!errors) return null;

  const result = {};

  if (Array.isArray(errors)) {
    for (const item of errors) {
      const field = item?.field || item?.param || item?.property;
      const msg = item?.defaultMessage || item?.message || item?.msg;
      if (field && msg) {
        result[field] = String(msg);
      }
    }
  } else if (typeof errors === 'object') {
    for (const [key, val] of Object.entries(errors)) {
      if (Array.isArray(val) && val.length > 0) {
        result[key] = String(val[0]);
      } else if (typeof val === 'string') {
        result[key] = val;
      } else if (val?.message) {
        result[key] = String(val.message);
      }
    }
  }

  return Object.keys(result).length > 0 ? result : null;
}

/**
 * Parses any Axios / Network / Runtime error into a structured, user-friendly format.
 */
export function parseApiError(error, customFallback) {
  if (!error) {
    return {
      message: customFallback || i18n.t('errors.unknown', { defaultValue: 'Noma’lum xatolik yuz berdi' }),
      status: null,
      code: '#ERR-UNK',
      isNetwork: false,
      isAuth: false,
      isForbidden: false,
      fieldErrors: null,
    };
  }

  const isNetwork = isApiNetworkError(error);
  const status = error.response?.status ?? error.status ?? null;
  const data = error.response?.data;
  const code = buildErrorReferenceCode(status, error);
  const fieldErrors = extractFieldErrors(data);

  let rawMessage = '';
  if (typeof data === 'string') {
    rawMessage = data;
  } else if (data?.message && typeof data.message === 'string') {
    rawMessage = data.message;
  } else if (data?.error && typeof data.error === 'string') {
    rawMessage = data.error;
  } else if (data?.detail && typeof data.detail === 'string') {
    rawMessage = data.detail;
  } else if (error.message && !error.response) {
    rawMessage = error.message;
  }

  // Determine user-friendly translated message
  let message = '';
  const isAuth = status === 401;
  const isForbidden = status === 403;

  if (isNetwork) {
    message = i18n.t('errors.network', {
      defaultValue: 'Internet yoki server bilan aloqa uzildi. Tarmoq ulanishini tekshiring.',
    });
  } else if (isAuth) {
    message = i18n.t('errors.unauthorized', {
      defaultValue: 'Sessiya muddati tugadi. Iltimos, qayta kiring.',
    });
  } else if (isForbidden) {
    message = i18n.t('errors.forbidden', {
      defaultValue: 'Ushbu amalni bajarish uchun sizda yetarli huquq yo‘q.',
    });
  } else if (status === 404) {
    message = rawMessage || i18n.t('errors.notFound', {
      defaultValue: 'So‘ralgan ma’lumot yoki sahifa topilmadi.',
    });
  } else if (status === 409) {
    message = rawMessage || i18n.t('errors.conflict', {
      defaultValue: 'Ma’lumotlar ziddiyati yuz berdi (allaqachon mavjud bo‘lishi mumkin).',
    });
  } else if (status === 422 || (status === 400 && fieldErrors)) {
    if (fieldErrors) {
      const firstError = Object.values(fieldErrors)[0];
      message = firstError || i18n.t('errors.validation', {
        defaultValue: 'Kiritilgan ma’lumotlar tekshiruvdan o‘tmadi.',
      });
    } else {
      message = rawMessage || i18n.t('errors.validation', {
        defaultValue: 'Kiritilgan ma’lumotlar tekshiruvdan o‘tmadi.',
      });
    }
  } else if (status === 429) {
    message = i18n.t('errors.tooManyRequests', {
      defaultValue: 'Juda ko‘p so‘rov yuborildi. Iltimos, biroz kuting.',
    });
  } else if (status >= 500 && status < 600) {
    message = i18n.t('errors.serverError', {
      defaultValue: 'Serverda ichki xatolik yuz berdi. Muhandislarimiz xabardor qilindi.',
    });
  } else if (rawMessage && rawMessage.length < 200) {
    message = rawMessage;
  } else if (customFallback) {
    message = customFallback;
  } else {
    message = i18n.t('errors.general', {
      defaultValue: 'Kutilmagan xatolik yuz berdi. Qayta urinib ko‘ring.',
    });
  }

  return {
    message,
    status,
    code,
    rawMessage,
    fieldErrors,
    isNetwork,
    isAuth,
    isForbidden,
  };
}

/**
 * Convenience helper that returns only the displayable error string.
 */
export function formatApiErrorMessage(error, customFallback) {
  return parseApiError(error, customFallback).message;
}

/**
 * Helper to feed backend validation errors into react-hook-form setError.
 */
export function applyServerValidationErrors(error, setError) {
  if (typeof setError !== 'function') return false;
  const parsed = parseApiError(error);
  if (!parsed.fieldErrors) return false;

  for (const [field, message] of Object.entries(parsed.fieldErrors)) {
    setError(field, { type: 'server', message });
  }
  return true;
}

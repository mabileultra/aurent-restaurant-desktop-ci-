import { normalizePhoneToE164 } from './phoneFormatUtils';
import {
  getAdminPasswordError,
  getPinValidationError,
  isValidEmail,
} from './userFormValidationUtils';

/**
 * Validates form submission data and builds user payload.
 * Returns { valid: true, payload } or { valid: false, field?: string, message?: string }.
 */
export function validateAndBuildUserPayload({
  data,
  role,
  username,
  pin,
  storeIds,
  isCashierRole,
  isPinRole,
  pinRequired,
  pinDirty,
  fieldOn,
  isEdit,
  isPlatform,
  companyId,
  t,
}) {
  const firstName = fieldOn('firstName') ? data.firstName?.trim() : username;
  const lastName = fieldOn('lastName') ? (data.lastName?.trim() || '') : '';
  const patronymic = fieldOn('patronymic') ? data.patronymic?.trim() || null : null;
  const rawEmail = data.email?.trim() || '';

  if (rawEmail && !isValidEmail(rawEmail)) {
    return {
      valid: false,
      field: 'email',
      targetId: 'user-email',
      message: t('validation.invalidEmail', { defaultValue: 'Email manzili noto‘g‘ri kiritildi' }),
    };
  }
  const email = rawEmail || `${username}@pos.internal`;

  const rawPhone = data.phone?.trim() || '';
  const phone = rawPhone ? normalizePhoneToE164(rawPhone) : undefined;
  if (phone && phone.replace(/\D/g, '').length !== 12) {
    return {
      valid: false,
      field: 'phone',
      targetId: 'user-phone',
      message: t('validation.invalidPhone', { defaultValue: 'Telefon raqami to‘liq kiritilmadi (+998 XX XXX-XX-XX)' }),
    };
  }

  let selectedStoreIds = Array.from(storeIds).map(Number).filter((n) => !Number.isNaN(n));

  if (isCashierRole) {
    if (selectedStoreIds.length === 0) {
      return { valid: false, message: t('users.cashierStoreRequired') };
    }
    if (selectedStoreIds.length > 1) {
      selectedStoreIds = [selectedStoreIds[0]];
    }
  }

  if (isPinRole) {
    if (pinRequired || (pin && pin.length > 0)) {
      const pinErr = getPinValidationError(pin);
      if (pinErr) {
        return { valid: false, field: 'pin', targetId: 'user-pin', message: pinErr };
      }
    }
  } else {
    const pwd = String(data.password || '').trim();
    const isAdminRole = role === 'ADMIN' || role === 'SUPER_ADMIN' || role === 'PLATFORM_ADMIN';
    if (!isEdit || pwd.length > 0) {
      if (isAdminRole) {
        const pwdErr = getAdminPasswordError(pwd);
        if (pwdErr) {
          return { valid: false, field: 'password', targetId: 'user-password', message: pwdErr };
        }
      } else if (pwd.length < 6) {
        return {
          valid: false,
          field: 'password',
          targetId: 'user-password',
          message: t('users.passwordMinLength', { defaultValue: 'Parol kamida 6 ta belgidan iborat bo‘lishi kerak' }),
        };
      }
    }
  }

  if (!username) {
    return { valid: false, message: t('validation.required') };
  }

  if (isPlatform && !isEdit && !companyId) {
    return { valid: false, message: t('users.companyRequired') };
  }

  if (!role) {
    return { valid: false, message: t('users.roleRequired', { defaultValue: 'Rolni tanlash majburiy' }) };
  }

  if (isEdit) {
    const newPassword = data.password?.trim() ?? '';
    const pinDigits = pin.replace(/\D/g, '');
    const shouldSendPin = pinDirty && pinDigits.length > 0;
    const payload = {
      username,
      ...(shouldSendPin ? { pin: pinDigits } : {}),
      firstName,
      lastName,
      patronymic,
      email,
      role,
      ...(phone ? { phone } : {}),
      companyId: isPlatform && companyId ? Number(companyId) : undefined,
      storeIds: selectedStoreIds,
    };
    if (newPassword.length >= 6) {
      payload.password = newPassword;
    }
    return { valid: true, payload };
  }

  const pwd = String(data.password || '').trim();
  const payload = {
    firstName,
    lastName,
    patronymic,
    username,
    email,
    ...(phone ? { phone } : {}),
    pin: isPinRole ? pin : undefined,
    ...(isPinRole || pwd.length === 0 ? {} : { password: pwd }),
    role,
    companyId: isPlatform && companyId ? Number(companyId) : undefined,
    storeIds: selectedStoreIds,
  };
  return { valid: true, payload };
}

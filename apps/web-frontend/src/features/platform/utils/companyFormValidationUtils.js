/**
 * companyFormValidationUtils.js
 * Pure validation functions and error extractors for company creation and editing.
 */

export const TIN_LENGTH = 9;
export const UZ_PHONE_DIGITS = 12;
export const UZ_LOCAL_PHONE_DIGITS = 9;
export const MIN_COMPANY_NAME_LENGTH = 2;

/**
 * Validates Uzbekistan phone number format.
 * Must contain either 12 digits starting with 998, or 9 local digits.
 * @param {string} phone
 * @returns {boolean}
 */
export function isValidUzPhone(phone) {
  if (!phone || typeof phone !== 'string') return false;
  const digits = phone.replace(/\D/g, '');
  if (digits.length === UZ_PHONE_DIGITS && digits.startsWith('998')) return true;
  if (digits.length === UZ_LOCAL_PHONE_DIGITS) return true;
  return false;
}

/**
 * Validates Uzbekistan TIN (STIR): exactly 9 numeric digits.
 * @param {string} tin
 * @returns {boolean}
 */
export function isValidTin(tin) {
  if (!tin || typeof tin !== 'string') return false;
  const trimmed = tin.trim();
  return /^\d{9}$/.test(trimmed);
}

/**
 * Returns human-readable error for company name, or null if valid.
 */
export function getCompanyNameError(name, t) {
  const trimmed = (name || '').trim();
  if (!trimmed) {
    return t ? t('platform.nameRequired', { defaultValue: 'Kompaniya nomi kiritilishi shart' }) : 'Kompaniya nomi kiritilishi shart';
  }
  if (trimmed.length < MIN_COMPANY_NAME_LENGTH) {
    return t ? t('platform.nameTooShort', { defaultValue: 'Kompaniya nomi kamida 2 ta belgidan iborat bo‘lishi kerak' }) : 'Kompaniya nomi kamida 2 ta belgidan iborat bo‘lishi kerak';
  }
  return null;
}

/**
 * Returns error for TIN.
 * In creation mode (!isEditing), TIN is mandatory (9 digits).
 * In edit mode, if entered it must be 9 digits.
 */
export function getCompanyTinError(tin, isEditing = false, t) {
  const trimmed = (tin || '').trim();
  if (!isEditing && !trimmed) {
    return t ? t('platform.tinRequired', { defaultValue: 'STIR (INN) kiritilishi shart' }) : 'STIR (INN) kiritilishi shart';
  }
  if (trimmed && (!isValidTin(trimmed) || trimmed.length !== TIN_LENGTH)) {
    return t ? t('platform.tinMustBe9Digits', { defaultValue: 'STIR 9 ta raqamdan iborat bo‘lishi kerak' }) : 'STIR 9 ta raqamdan iborat bo‘lishi kerak';
  }
  return null;
}

/**
 * Returns error for phone.
 * In creation mode (!isEditing), Phone is mandatory (valid UZ phone).
 * In edit mode, if entered it must be a valid UZ phone.
 */
export function getCompanyPhoneError(phone, isEditing = false, t) {
  const trimmed = (phone || '').trim();
  if (!isEditing && !trimmed) {
    return t ? t('platform.phoneRequired', { defaultValue: 'Telefon raqami kiritilishi shart' }) : 'Telefon raqami kiritilishi shart';
  }
  if (trimmed && !isValidUzPhone(trimmed)) {
    return t ? t('platform.phoneIncomplete', { defaultValue: 'Telefon raqami to‘liq kiritilishi shart (+998 XX XXX XX XX)' }) : 'Telefon raqami to‘liq kiritilishi shart (+998 XX XXX XX XX)';
  }
  return null;
}

/**
 * Returns region and district errors based on mode and inputs.
 */
export function getCompanyGeoErrors(regionCode, districtCode, isEditing, t) {
  const hasRegion = Boolean(regionCode?.trim());
  const hasDistrict = Boolean(districtCode?.trim());

  let region = null;
  let district = null;

  if (!isEditing) {
    if (!hasRegion) {
      region = t ? t('platform.regionRequired', { defaultValue: 'Viloyatni tanlang' }) : 'Viloyatni tanlang';
    }
    if (!hasDistrict) {
      district = t ? t('platform.districtRequired', { defaultValue: 'Tumanni tanlang' }) : 'Tumanni tanlang';
    }
  } else if (hasRegion && !hasDistrict) {
    district = t ? t('platform.districtRequired', { defaultValue: 'Tumanni tanlang' }) : 'Tumanni tanlang';
  }

  return { region, district };
}

/**
 * Returns error for business type selection.
 */
export function getCompanyBusinessTypesError(businessTypeIds, t) {
  if (!Array.isArray(businessTypeIds) || businessTypeIds.length === 0) {
    return t ? t('platform.businessTypesRequired', { defaultValue: 'Kamida bitta faoliyat turi tanlanishi shart' }) : 'Kamida bitta faoliyat turi tanlanishi shart';
  }
  return null;
}

/**
 * Comprehensive validation function for company form.
 * @param {object} form
 * @param {object} options
 * @param {boolean} [options.isEditing=false]
 * @param {function} [options.t]
 * @returns {{ errors: object, isValid: boolean }}
 */
export function validateCompanyForm(form = {}, { isEditing = false, t } = {}) {
  const errors = {};

  const nameError = getCompanyNameError(form.name, t);
  if (nameError) errors.name = nameError;

  const tinError = getCompanyTinError(form.tin, isEditing, t);
  if (tinError) errors.tin = tinError;

  const phoneError = getCompanyPhoneError(form.phone, isEditing, t);
  if (phoneError) errors.phone = phoneError;

  const { region, district } = getCompanyGeoErrors(form.regionCode, form.districtCode, isEditing, t);
  if (region) errors.regionCode = region;
  if (district) errors.districtCode = district;

  const btError = getCompanyBusinessTypesError(form.businessTypeIds, t);
  if (btError) errors.businessTypeIds = btError;

  return {
    errors,
    isValid: Object.keys(errors).length === 0,
  };
}

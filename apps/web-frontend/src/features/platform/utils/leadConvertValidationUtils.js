export const TIN_LENGTH = 9;
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validates lead-to-company conversion inputs and computes submit readiness.
 */
export function validateCompanyConvertForm({
  companyName = '',
  regionCode = '',
  districtCode = '',
  tin = '',
  createAdmin = true,
  adminLogin = '',
  adminEmail = '',
  isSubmitting = false,
} = {}) {
  const isCompanyNameValid = Boolean(companyName?.trim());
  const isGeoValid = Boolean(regionCode?.trim() && districtCode?.trim());
  const isTinValid = !tin?.trim() || tin.trim().length === TIN_LENGTH;

  const isAdminLoginValid = !createAdmin || Boolean(adminLogin?.trim());
  const isAdminEmailValid = !createAdmin || EMAIL_REGEX.test(adminEmail?.trim() || '');
  const isAdminValid = !createAdmin || (isAdminLoginValid && isAdminEmailValid);

  const canSubmit = isCompanyNameValid && isGeoValid && isTinValid && isAdminValid && !isSubmitting;

  let validationHint = 'Kompaniya yaratishga tayyor';
  if (isSubmitting) {
    validationHint = 'Kompaniya yaratilmoqda…';
  } else if (!isCompanyNameValid) {
    validationHint = 'Kompaniya nomini kiriting';
  } else if (!isGeoValid) {
    validationHint = 'Viloyat va tumanni tanlang';
  } else if (!isTinValid) {
    validationHint = `STIR ${TIN_LENGTH} ta raqamdan iborat bo'lishi kerak`;
  } else if (createAdmin && !adminLogin?.trim()) {
    validationHint = 'Admin loginini kiriting';
  } else if (createAdmin && !adminEmail?.trim()) {
    validationHint = 'Admin email manzilini kiriting';
  } else if (createAdmin && !isAdminEmailValid) {
    validationHint = "Admin uchun to'g'ri email manzilini kiriting";
  }

  return {
    isCompanyNameValid,
    isGeoValid,
    isTinValid,
    isAdminLoginValid,
    isAdminEmailValid,
    isAdminValid,
    canSubmit,
    validationHint,
  };
}

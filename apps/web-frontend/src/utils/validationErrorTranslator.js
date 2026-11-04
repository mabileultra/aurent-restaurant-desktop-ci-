const FIELD_LABELS_UZ = {
  regionCode: 'Viloyat',
  districtCode: 'Tuman',
  name: 'Nomi',
  legalName: 'Yuridik nomi',
  loginCode: 'Login kodi',
  tin: 'STIR',
  phone: 'Telefon raqami',
  email: 'Email',
  username: 'Login',
  password: 'Parol',
  businessType: 'Faoliyat turi',
  businessTypeIds: 'Faoliyat turlari',
  defaultBusinessTypeId: 'Asosiy faoliyat turi',
  storeName: 'Filial nomi',
  branchName: 'Filial nomi',
};

const CONSTRAINT_MESSAGES_UZ = {
  'must not be blank': 'tanlanishi yoki kiritilishi shart',
  'must not be empty': 'tanlanishi yoki kiritilishi shart',
  'must not be null': 'tanlanishi shart',
  'is required': 'kiritilishi shart',
  'must be greater than or equal to 1': 'kamida 1 bo‘lishi kerak',
};

/**
 * Translates a single field validation error into human-readable Uzbek.
 */
export function translateValidationError(field, rawMessage) {
  const fieldLabel = FIELD_LABELS_UZ[field] || field;
  const lowerMsg = String(rawMessage || '').trim().toLowerCase();
  const matchedConstraint = CONSTRAINT_MESSAGES_UZ[lowerMsg];

  if (matchedConstraint) {
    return `${fieldLabel} ${matchedConstraint}`;
  }
  return rawMessage;
}

/**
 * Replaces common raw backend error substrings with translated Uzbek equivalents.
 */
export function translateRawErrorMessage(raw) {
  if (!raw || typeof raw !== 'string') return raw;
  let text = raw;

  if (text.includes('regionCode: must not be blank')) {
    text = text.replace(/regionCode:\s*must not be blank/gi, 'Viloyat tanlanishi shart');
  }
  if (text.includes('districtCode: must not be blank')) {
    text = text.replace(/districtCode:\s*must not be blank/gi, 'Tuman tanlanishi shart');
  }
  if (text.includes('name: must not be blank')) {
    text = text.replace(/name:\s*must not be blank/gi, 'Nomi kiritilishi shart');
  }
  if (text.toLowerCase().includes('business type is not allowed for this company')) {
    return 'Tanlangan faoliyat turi ushbu kompaniyaga biriktirilmagan';
  }
  if (text.startsWith('Validation failed for object') || /^validation failed\b/i.test(text.trim())) {
    return 'Kiritilgan ma’lumotlar tekshiruvdan o‘tmadi';
  }
  return text;
}

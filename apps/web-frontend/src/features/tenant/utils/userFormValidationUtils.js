/**
 * userFormValidationUtils.js
 * Pure validation and sanitization helpers for user creation and editing.
 */

const ASCENDING_DIGITS = '0123456789';
const DESCENDING_DIGITS = '9876543210';
const COMMON_REPETITIVE_PATTERNS = new Set([
  '1212', '121212', '1122', '112233', '1313', '2424', '2580', '0852',
]);

/**
 * Checks whether an admin password meets security standards (at least 8 chars, letter + number).
 * @param {string} password
 * @returns {boolean}
 */
export function isValidAdminPassword(password) {
  if (!password || typeof password !== 'string') return false;
  const trimmed = password.trim();
  if (trimmed.length < 8) return false;
  const hasLetter = /[A-Za-z]/.test(trimmed);
  const hasDigit = /\d/.test(trimmed);
  return hasLetter && hasDigit;
}

/**
 * Returns human-readable Uzbek error message for invalid admin password.
 * @param {string} password
 * @returns {string|null}
 */
export function getAdminPasswordError(password) {
  if (!password || !password.trim()) {
    return 'Parol kiritilishi shart';
  }
  if (!isValidAdminPassword(password)) {
    return 'Parol kamida 8 ta belgidan iborat bo‘lib, harf va raqam qatnashishi shart';
  }
  return null;
}

/**
 * Checks whether a 4-6 digit PIN is overly simple (e.g. 0000, 11111, 1234, 123456, 4321).
 * @param {string} pin
 * @returns {boolean}
 */
export function isWeakPin(pin) {
  if (!pin || typeof pin !== 'string') return false;
  const trimmed = pin.trim();
  if (!/^\d{4,6}$/.test(trimmed)) return false;

  // 1. All digits are identical (e.g. '0000', '11111', '999999')
  if (/^(\d)\1+$/.test(trimmed)) return true;

  // 2. Sequential numbers ascending or descending (e.g. '1234', '123456', '654321')
  if (ASCENDING_DIGITS.includes(trimmed) || DESCENDING_DIGITS.includes(trimmed)) return true;

  // 3. Common repeating patterns (e.g. '1212', '121212', '1122', '2580')
  if (COMMON_REPETITIVE_PATTERNS.has(trimmed)) return true;

  return false;
}

/**
 * Returns human-readable Uzbek error for weak PINs.
 * @param {string} pin
 * @returns {string|null}
 */
export function getPinValidationError(pin) {
  if (!pin || !pin.trim()) {
    return 'PIN-kod kiritilishi shart';
  }
  const trimmed = pin.trim();
  if (!/^\d{4,6}$/.test(trimmed)) {
    return 'PIN-kod 4 dan 6 tagacha raqamdan iborat bo‘lishi kerak';
  }
  if (isWeakPin(trimmed)) {
    return 'Juda oddiy PIN-kod (masalan 1234 yoki 0000). Xavfsizroq PIN kiriting';
  }
  return null;
}

/**
 * Validates standard email address format.
 * @param {string} email
 * @returns {boolean}
 */
export function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

/**
 * Strips leading dashes, em-dashes, and whitespace from full name.
 * Returns empty string if name consists only of dashes or is empty.
 * @param {string} name
 * @param {string} [fallbackUsername]
 * @returns {string}
 */
export function sanitizeUserDisplayName(name, fallbackUsername = '') {
  if (!name || typeof name !== 'string') return fallbackUsername || '';
  const cleaned = name.replace(/^[-—\s]+/, '').trim();
  if (!cleaned || /^[-—]+$/.test(cleaned)) {
    return fallbackUsername || '';
  }
  return cleaned;
}

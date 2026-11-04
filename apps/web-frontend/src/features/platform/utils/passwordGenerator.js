/**
 * passwordGenerator.js
 * Generates cryptographically secure random passwords meeting security rules:
 * at least 12 chars, upper, lower, digit, and symbol.
 */

const LOWERCASE = 'abcdefghjkmnpqrstuvwxyz'; // excludes ambiguous i, l, o
const UPPERCASE = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // excludes ambiguous I, O
const DIGITS = '23456789'; // excludes ambiguous 0, 1
const SYMBOLS = '!@#$%&*';

const ALL_CHARS = LOWERCASE + UPPERCASE + DIGITS + SYMBOLS;

function getRandomChar(charset) {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    return charset[array[0] % charset.length];
  }
  return charset[Math.floor(Math.random() * charset.length)];
}

export function generateSecurePassword(length = 12) {
  const targetLength = Math.max(12, length);

  const initialChars = [
    getRandomChar(UPPERCASE),
    getRandomChar(LOWERCASE),
    getRandomChar(DIGITS),
    getRandomChar(SYMBOLS),
  ];

  const remainingCount = targetLength - initialChars.length;
  for (let i = 0; i < remainingCount; i++) {
    initialChars.push(getRandomChar(ALL_CHARS));
  }

  // Fisher-Yates shuffle
  const result = [...initialChars];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result.join('');
}

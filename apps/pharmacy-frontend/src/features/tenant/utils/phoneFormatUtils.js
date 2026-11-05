/**
 * Utility for formatting and normalizing Uzbekistan phone numbers (+998)
 */

export function formatUzbekPhone(value) {
  if (!value) return '';
  // Extract all digits
  let digits = String(value).replace(/\D/g, '');

  // If starts with 998, keep as is
  if (digits.startsWith('998')) {
    digits = digits.slice(0, 12);
  } else if ('998'.startsWith(digits)) {
    // User is backspacing or typing the country prefix ('9' or '99')
    return digits ? '+' + digits : '';
  } else if (digits.length > 0) {
    digits = ('998' + digits).slice(0, 12);
  }

  // Format into +998 (XX) XXX-XX-XX
  let res = '+998';
  if (digits.length > 3) {
    res += ' (' + digits.slice(3, 5);
  }
  if (digits.length >= 5) {
    res += ') ' + digits.slice(5, 8);
  }
  if (digits.length >= 8) {
    res += '-' + digits.slice(8, 10);
  }
  if (digits.length >= 10) {
    res += '-' + digits.slice(10, 12);
  }
  return res;
}

export function normalizePhoneToE164(value) {
  if (!value) return '';
  const digits = String(value).replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('998')) {
    return digits.length > 3 ? '+' + digits.slice(0, 12) : '';
  }
  return '+998' + digits.slice(0, 9);
}

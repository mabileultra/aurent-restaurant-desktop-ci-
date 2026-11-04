export function digitsOnly(value, max) {
  return String(value || '').replace(/\D/g, '').slice(0, max);
}

export function formatCardNumber(value) {
  return digitsOnly(value, 16).replace(/(\d{4})(?=\d)/g, '$1 ').trim();
}

export function formatCardExpiry(value) {
  const digits = digitsOnly(value, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export function detectUzCardBrand(panDigits) {
  if (panDigits.startsWith('9860')) return 'HUMO';
  if (panDigits.startsWith('8600')) return 'UZCARD';
  return null;
}

export function cardFormComplete(card) {
  const pan = digitsOnly(card?.pan, 16);
  const exp = digitsOnly(card?.exp, 4);
  const cvv = digitsOnly(card?.cvv, 3);
  return pan.length === 16 && exp.length === 4 && cvv.length === 3;
}

export function maskedPan(pan) {
  const digits = digitsOnly(pan, 16);
  if (!digits) return '•••• •••• •••• ••••';
  const padded = digits.padEnd(16, '•');
  return `${padded.slice(0, 4)} ${padded.slice(4, 8)} ${padded.slice(8, 12)} ${padded.slice(12, 16)}`;
}

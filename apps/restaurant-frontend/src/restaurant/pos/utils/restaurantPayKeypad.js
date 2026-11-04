/** Append digit to money input string (integer sums for UZS keypad). */
export function appendPayDigit(current, digit) {
  const d = String(digit);
  if (!/^\d$/.test(d)) return current || '';
  const base = !current || current === '0' ? '' : String(current);
  const next = `${base}${d}`.replace(/^0+(?=\d)/, '');
  return next.length > 12 ? String(current) : next;
}

export function backspacePayValue(current) {
  const raw = String(current || '');
  if (!raw) return '';
  return raw.slice(0, -1);
}

export function setPayExact(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n) || n <= 0) return '';
  const rounded = Math.round(n * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2);
}

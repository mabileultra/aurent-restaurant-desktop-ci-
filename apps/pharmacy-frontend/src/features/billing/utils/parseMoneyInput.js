/** Parse money entered by user: spaces, commas, nbsp. Returns null if invalid/empty. */
export function parseMoneyInput(raw, { allowZero = false } = {}) {
  if (raw == null) return null;
  const cleaned = String(raw)
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, '')
    .replace(/,/g, '.')
    .trim();
  if (!cleaned) return allowZero ? 0 : null;
  const n = Number(cleaned);
  if (!Number.isFinite(n) || n < 0) return null;
  if (!allowZero && n <= 0) return null;
  return n;
}

/**
 * Strictly formats an amount input to digits only with space thousand separators (e.g. "1 000 000").
 * Strips all non-digit characters (letters, symbols).
 */
export function formatMoneyInputDigits(raw) {
  if (raw == null) return '';
  let digits = String(raw).replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length > 1) {
    digits = digits.replace(/^0+(?=\d)/, '');
  }
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

const ALLOWED_CONTROL_KEYS = new Set([
  'Backspace',
  'Delete',
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'ArrowDown',
  'Tab',
  'Enter',
  'Escape',
  'Home',
  'End',
]);

/**
 * KeyDown event handler for strict numeric-only inputs.
 * Blocks all non-digit characters, while permitting control keys and shortcuts (Ctrl/Cmd+A/C/V/Z/X).
 */
export function preventNonNumericKey(e) {
  if (!e) return;
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.key === 'Unidentified') return;
  if (ALLOWED_CONTROL_KEYS.has(e.key)) return;
  if (e.key >= '0' && e.key <= '9') return;
  e.preventDefault();
}


/** Presets for plate portion size (PORTION unit). */
export const PORTION_AMOUNT_PRESETS = ['0.5', '0.7', '1', '1.5'];

const HALF_ALIASES = new Set([
  '1.5',
  '1,5',
  'полтора',
  'poltora',
  '1.50',
  '1,50',
]);

/**
 * Clean value for inputs / POS labels: 1.000 → "1", 1.500 → "1.5", 1.001 stays.
 */
export function formatPortionAmountDisplay(raw) {
  if (raw == null || raw === '') return '';
  const n = Number(String(raw).replace(',', '.'));
  if (!Number.isFinite(n) || n <= 0) return '';
  // Avoid binary float junk (1.5000000002) and BigDecimal scale noise (1.000).
  const rounded = Math.round(n * 1000) / 1000;
  return String(rounded)
    .replace(/(\.\d*?)0+$/, '$1')
    .replace(/\.$/, '');
}

/**
 * Parse admin/POS typed portion: "1", "1,5", "полтора", "0.7".
 * Returns null if empty/invalid.
 */
export function parsePortionAmountInput(raw) {
  const text = String(raw ?? '').trim().toLowerCase().replace(/\s+/g, '');
  if (!text) return null;
  if (HALF_ALIASES.has(text)) return 1.5;
  const normalized = text.replace(',', '.');
  if (!/^\d+(\.\d{1,3})?$/.test(normalized)) return null;
  const n = Number(normalized);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 1000) / 1000;
}

/** Live typing: keep digits / one decimal separator; map known words on blur via parse. */
export function sanitizePortionAmountTyping(raw) {
  const text = String(raw ?? '');
  const lower = text.trim().toLowerCase();
  if (lower === 'п' || lower.startsWith('полт') || lower.startsWith('polt')) {
    return text;
  }
  return text
    .replace(/,/g, '.')
    .replace(/[^\d.]/g, '')
    .replace(/(\..*)\./g, '$1');
}

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

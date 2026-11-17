/** Запрещённые MXIK/IKPU (AUR-14). Синхрон с backend ForbiddenMxikCodes. */
export const FORBIDDEN_MXIK_REASON_CODE = 'FORBIDDEN_MXIK';

export const FORBIDDEN_MXIK_CODES = Object.freeze([
  '06302001004033010',
  '09405001011002016',
  '00000000000000000',
]);

const BLOCKED = new Set(FORBIDDEN_MXIK_CODES);

export function normalizeMxik(raw) {
  if (raw == null) return '';
  return String(raw).replace(/\D+/g, '');
}

export function isForbiddenMxik(raw) {
  const code = normalizeMxik(raw);
  return code.length > 0 && BLOCKED.has(code);
}

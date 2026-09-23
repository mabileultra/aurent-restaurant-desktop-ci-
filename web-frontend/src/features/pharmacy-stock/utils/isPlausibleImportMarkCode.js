/** Отсекаем флаг Didox и мусор — в ASL уходят только похожие на DataMatrix КМ. */
const MIN_CODE_LENGTH = 20;

export function isPlausibleImportMarkCode(raw) {
  const code = String(raw || '').trim();
  if (!code || code.length < MIN_CODE_LENGTH) return false;
  const lower = code.toLowerCase().replace(/ё/g, 'е');
  if (lower.includes('маркировкаланган') || lower.includes('markirovkalangan')) return false;
  return /\d/.test(code);
}

export function filterPlausibleImportMarkCodes(codes) {
  if (!Array.isArray(codes)) return [];
  const seen = new Set();
  const out = [];
  for (const raw of codes) {
    const code = String(raw || '').trim();
    if (!isPlausibleImportMarkCode(code)) continue;
    const key = code.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(code);
  }
  return out;
}

import { isPharmacyMarkingCode } from '../../pharmacy-cashier/utils/pharmacyMarkingCode';

/** Импорт → ASL: только DataMatrix КМ, не ИКПУ и не «Маркировкаланган». */
export function isPlausibleImportMarkCode(raw) {
  return isPharmacyMarkingCode(raw);
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

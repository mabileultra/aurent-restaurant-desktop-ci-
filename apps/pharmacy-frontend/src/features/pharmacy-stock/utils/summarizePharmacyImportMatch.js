import { classifyPharmacyImportMatch } from './classifyPharmacyImportMatch';

export function summarizePharmacyImportMatch(items = []) {
  const rows = Array.isArray(items) ? items : [];
  let found = 0;
  let partial = 0;
  let missing = 0;
  let duplicate = 0;
  let selected = 0;
  for (const item of rows) {
    const tone = classifyPharmacyImportMatch(item);
    if (tone === 'found') found += 1;
    if (tone === 'partial') partial += 1;
    if (tone === 'missing') missing += 1;
    if (tone === 'duplicate') duplicate += 1;
    if (item?.selected && tone !== 'duplicate') selected += 1;
  }
  return {
    total: rows.length,
    found,
    partial,
    missing,
    duplicate,
    selected,
  };
}

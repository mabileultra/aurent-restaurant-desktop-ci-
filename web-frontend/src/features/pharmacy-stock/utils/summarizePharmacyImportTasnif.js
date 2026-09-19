/** Сводка проверки тасниф по строкам импорта / прихода. */

export function summarizePharmacyImportTasnif(items = []) {
  const rows = Array.isArray(items) ? items : [];
  let marked = 0;
  let found = 0;
  let manual = 0;
  let pack = 0;
  let rx = 0;
  let otc = 0;
  for (const item of rows) {
    if (item?.markedProduct) marked += 1;
    if (item?.ikpuStatus === 'FOUND') found += 1;
    if (item?.ikpuStatus === 'MANUAL') manual += 1;
    if (String(item?.packageCode || '').trim()) pack += 1;
    if (item?.prescriptionRequired === true) rx += 1;
    if (item?.prescriptionRequired === false) otc += 1;
  }
  return {
    total: rows.length,
    marked,
    found,
    manual,
    pack,
    rx,
    otc,
  };
}

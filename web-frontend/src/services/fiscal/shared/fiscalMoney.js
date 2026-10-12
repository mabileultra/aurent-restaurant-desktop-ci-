/** Сумы → тийины (целое). */
export function toTiyin(sumAmount) {
  const n = Number(sumAmount) || 0;
  return Math.round(n * 100);
}

/** «ГГГГ-ММ-ДД ЧЧ:ММ:СС» по локальному времени кассы. */
export function formatFiscalDateTime(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  const pad = (v) => String(v).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

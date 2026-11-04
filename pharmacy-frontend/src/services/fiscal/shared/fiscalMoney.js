/** Сумы → тийины (целое). */
export function toTiyin(sumAmount) {
  const n = Number(sumAmount) || 0;
  return Math.round(n * 100);
}

const FISCAL_DATE_TIME = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;

export function isFiscalDateTime(value) {
  return FISCAL_DATE_TIME.test(String(value || '').trim());
}

/** «ГГГГ-ММ-ДД ЧЧ:ММ:СС» по локальному времени кассы. */
export function formatFiscalDateTime(date = new Date()) {
  const parsed = date instanceof Date ? date : new Date(date);
  const d = Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  const pad = (v) => String(v).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/** RefundInfo.DateTime в доке — ГГГГММДДЧЧММСС, не формат Time. */
export function toFiscalRefundDateTime(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (/^\d{14}$/.test(raw)) return raw;
  if (isFiscalDateTime(raw)) return raw.replace(/\D/g, '');
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return '';
  return formatFiscalDateTime(d).replace(/\D/g, '');
}

/** Суммы чека Multikassa (тийины = сум * 100). */
export function toTiyin(sumAmount) {
  const n = Number(sumAmount) || 0;
  return Math.round(n * 100);
}

/** Цены позиций остаются в сумах. */
export function toSum(amount) {
  const n = Number(amount) || 0;
  return Math.round(n * 100) / 100;
}

export function formatMultikassaDateTime(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  const pad = (v) => String(v).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

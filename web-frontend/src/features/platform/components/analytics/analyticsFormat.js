export function fmtNum(n) {
  if (n == null || Number.isNaN(Number(n))) return '—';
  return Number(n).toLocaleString('ru-RU');
}

export function fmtMoney(n) {
  if (n == null || Number.isNaN(Number(n))) return '—';
  const v = Number(n);
  if (Math.abs(v) >= 1e12) return `${(v / 1e12).toLocaleString('ru-RU', { maximumFractionDigits: 1 })} трлн`;
  if (Math.abs(v) >= 1e9) return `${(v / 1e9).toLocaleString('ru-RU', { maximumFractionDigits: 1 })} млрд`;
  if (Math.abs(v) >= 1e6) return `${(v / 1e6).toLocaleString('ru-RU', { maximumFractionDigits: 1 })} млн`;
  return `${v.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} сум`;
}

export function fmtDay(iso) {
  if (!iso) return '—';
  const [year, month, day] = String(iso).split('-').map(Number);
  if (!year || !month || !day) return String(iso);
  return new Date(year, month - 1, day).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' });
}

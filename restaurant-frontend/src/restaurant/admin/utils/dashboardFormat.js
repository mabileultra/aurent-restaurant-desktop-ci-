import { fmtMoneyCompact } from '../../../utils/formatMoney';

export function formatPctDelta(value) {
  if (value == null || Number.isNaN(Number(value))) return null;
  const n = Number(value);
  const sign = n > 0 ? '↑' : n < 0 ? '↓' : '·';
  return `${sign} ${Math.abs(n).toFixed(1)}%`;
}

export function formatAbsDelta(value) {
  if (value == null || Number.isNaN(Number(value))) return null;
  const n = Number(value);
  const sign = n > 0 ? '↑' : n < 0 ? '↓' : '·';
  return `${sign} ${Math.abs(n)}`;
}

export function formatMoneyOrDash(value) {
  if (value == null) return '—';
  return fmtMoneyCompact(value);
}

import { fmtMoneyCompact } from '../../../utils/formatMoney';

/** Approximate ESC/POS width for 80mm; content still wraps on device. */
export const TICKET_WIDTH = 32;

export function padRow(left, right, width = TICKET_WIDTH) {
  const L = String(left ?? '').trimEnd();
  const R = String(right ?? '').trim();
  if (!R) return L;
  if (!L) return R.padStart(width);
  const maxLeft = Math.max(1, width - R.length - 1);
  const clipped = L.length > maxLeft ? `${L.slice(0, Math.max(1, maxLeft - 1))}…` : L;
  const gap = Math.max(1, width - clipped.length - R.length);
  return `${clipped}${' '.repeat(gap)}${R}`;
}

export function moneyRow(label, amount, width = TICKET_WIDTH) {
  return padRow(label, fmtMoneyCompact(amount), width);
}

export function qtyNameRow(qty, name, width = TICKET_WIDTH) {
  const q = Number(qty) || 0;
  return `${q} x ${String(name || '').trim()}`.slice(0, width);
}

export function ticketStamp(iso) {
  const d = iso ? new Date(iso) : new Date();
  if (!Number.isFinite(d.getTime())) return new Date().toLocaleString();
  return d.toLocaleString();
}

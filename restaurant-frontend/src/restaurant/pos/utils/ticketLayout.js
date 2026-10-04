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

/** Match Electron 80mm receipt width (42); padRow → leftRight on print. */
const KITCHEN_QTY_WIDTH = 42;

/** Kitchen / category slip line: name left, qty right. */
export function qtyNameRow(qty, name, width = KITCHEN_QTY_WIDTH) {
  const q = Number(qty) || 0;
  const qtyLabel = Number.isInteger(q) || Math.abs(q - Math.round(q)) < 0.0005
    ? `×${Math.round(q)}`
    : `×${q}`;
  return padRow(String(name || '').trim(), qtyLabel, width);
}

export function ticketStamp(iso) {
  const d = iso ? new Date(iso) : new Date();
  if (!Number.isFinite(d.getTime())) return new Date().toLocaleString();
  return d.toLocaleString();
}

/** Top of kitchen / auto-print slips: hall + table (or channel), waiter, time. */
export function kitchenTicketMetaLines({
  order,
  header,
  waiterName,
  t,
  at,
} = {}) {
  const channel = order?.channel || 'DINE_IN';
  let tableLine = header;
  if (!tableLine) {
    if (channel === 'TAKEAWAY') {
      tableLine = `TAKEAWAY #${order?.orderNo || ''}`;
    } else if (channel === 'DELIVERY') {
      tableLine = `DELIVERY #${order?.orderNo || ''}`;
    } else {
      const code = order?.tableCode || '—';
      const hall = order?.hallName || null;
      tableLine = hall
        ? (t?.('rst.order.ticketTitle', {
          code,
          hall,
          defaultValue: `${hall} · Стол ${code}`,
        }) || `${hall} · Стол ${code}`)
        : (t?.('rst.order.tableHeading', {
          code,
          defaultValue: `Стол ${code}`,
        }) || `Стол ${code}`);
    }
  }
  const waiterLabel = t?.('rst.order.waiter', { defaultValue: 'Официант' }) || 'Официант';
  const lines = [tableLine];
  if (waiterName) lines.push(`${waiterLabel}: ${waiterName}`);
  lines.push(ticketStamp(at));
  return lines.filter(Boolean);
}

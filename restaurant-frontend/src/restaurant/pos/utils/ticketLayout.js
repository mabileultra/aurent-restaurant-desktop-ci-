import { fmtMoneyCompact } from '../../../utils/formatMoney';

/** Approximate ESC/POS width for 80mm; content still wraps on device. */
export const TICKET_WIDTH = 32;

/** 80mm Font A column count — guest bill / kitchen pad rows. */
export const RECEIPT_WIDTH = 42;

/** Prefix: ESC/POS prints this line bold + slightly taller (strip before output). */
export const EMPH_LINE_PREFIX = '§E§';

/** Prefix: bold only (cancel/refuse dish lines — a bit stronger than body). */
export const BOLD_LINE_PREFIX = '§B§';

export function emphPadRow(left, right, width = RECEIPT_WIDTH) {
  return `${EMPH_LINE_PREFIX}${padRow(left, right, width)}`;
}

export function boldPadRow(left, right, width = RECEIPT_WIDTH) {
  return `${BOLD_LINE_PREFIX}${padRow(left, right, width)}`;
}

export function isRefuseTicketTitle(title) {
  return /отказ/i.test(String(title || ''));
}

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

/** Refuse / cancel dish line: bold + slightly taller on ESC/POS. */
export function emphQtyNameRow(qty, name, width = KITCHEN_QTY_WIDTH) {
  return `${EMPH_LINE_PREFIX}${qtyNameRow(qty, name, width)}`;
}

export function ticketStamp(iso) {
  const d = iso ? new Date(iso) : new Date();
  if (!Number.isFinite(d.getTime())) return new Date().toLocaleString();
  return d.toLocaleString();
}

/** Check number already present (takeaway `#12` or `№12`). */
function hasCheckNo(line, orderNo) {
  const text = String(line || '');
  if (orderNo != null && text.includes(`№${orderNo}`)) return true;
  return /#\s*\d+/.test(text);
}

function checkNoMark(order) {
  const no = order?.orderNo;
  if (no == null || no === '' || no === '—') return '';
  const n = Number(no);
  if (!Number.isFinite(n) || n <= 0) return '';
  return `№${n}`;
}

/** Place line plus the order check number so each new order prints a new №. */
function withCheckNo(line, order) {
  const mark = checkNoMark(order);
  if (!mark || hasCheckNo(line, order?.orderNo)) return line;
  return line ? `${line} · ${mark}` : mark;
}

/** Top of kitchen / auto-print slips: hall + table (or channel), check №, waiter, time. */
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
  tableLine = withCheckNo(tableLine, order);
  const waiterLabel = t?.('rst.order.waiter', { defaultValue: 'Официант' }) || 'Официант';
  const lines = [tableLine];
  if (waiterName) lines.push(`${waiterLabel}: ${waiterName}`);
  lines.push(ticketStamp(at));
  return lines.filter(Boolean);
}

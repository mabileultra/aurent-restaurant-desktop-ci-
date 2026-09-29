/**
 * Desktop print relay: run a server print job on this machine if it owns the printer.
 */
import { rstOrderApi } from '../../api/order.api';
import { printGuestBill } from './printGuestBill';
import { printKitchenTicket } from './printKitchenTicket';
import {
  isDesktopPrinter,
  listDesktopPrinters,
  printTicketLines,
} from './desktopPrinters';

function parsePayload(raw) {
  try {
    return typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch {
    return null;
  }
}

function localHasPrinter(printerName) {
  const name = String(printerName || '').trim();
  if (!name) return false;
  try {
    const list = listDesktopPrinters();
    return (list || []).some((p) => String(p?.name || p).trim() === name);
  } catch {
    return false;
  }
}

function headerFor(order, t) {
  const channel = order?.channel || 'DINE_IN';
  if (channel === 'TAKEAWAY') return `TAKEAWAY #${order.orderNo || ''}`;
  if (channel === 'DELIVERY') return `DELIVERY #${order.orderNo || ''}`;
  const table = t?.('rst.order.tableHeading', {
    code: order?.tableCode || '—',
    defaultValue: `Стол ${order?.tableCode || '—'}`,
  }) || `TABLE ${order?.tableCode || '—'}`;
  return `${table} #${order?.orderNo || ''}`;
}

function itemLines(item) {
  const qty = Number(item.quantity) || 0;
  const portion = item.portionText ? ` · ${item.portionText}` : '';
  const lines = [`${qty} x ${item.name || ''}${portion}`];
  const mods = (item.modifiers || [])
    .map((m) => (typeof m === 'string' ? m : (m.name || m.optionName || '')))
    .filter(Boolean)
    .join(', ');
  if (mods) lines.push(`+ ${mods}`);
  if (item.note) lines.push(`* ${item.note}`);
  return lines;
}

async function runCategorySlip(payload, t) {
  const printer = String(payload.printerName || '').trim();
  if (!localHasPrinter(printer)) return { mode: 'skip', ack: false };
  const orderRes = await rstOrderApi.get(payload.orderId);
  const order = orderRes.data;
  const line = (order.items || []).find((item) => String(item.id) === String(payload.orderItemId));
  if (!line) return { mode: 'skip', ack: false };
  const qty = Number(payload.quantity) || Number(line.quantity) || 1;
  await printTicketLines({
    title: payload.categoryName || '',
    printerName: printer,
    lines: [
      headerFor(order, t),
      new Date().toLocaleString(),
      '---',
      ...itemLines({ ...line, quantity: qty }),
    ],
  });
  return { mode: 'silent', ack: true };
}

/**
 * @returns {Promise<{ ack: boolean, mode?: string }>}
 */
export async function executeRestaurantPrintJob(job, { t } = {}) {
  if (!job || !isDesktopPrinter()) return { ack: false };
  const payload = parsePayload(job.payload);
  if (!payload) return { ack: false };

  if (job.kind === 'GUEST_BILL') {
    const orderRes = await rstOrderApi.get(payload.orderId);
    const printed = await printGuestBill({ order: orderRes.data, t });
    if (printed?.mode === 'silent') return { ack: true, mode: 'silent' };
    if (printed?.mode === 'missing') return { ack: true, mode: 'missing' };
    return { ack: false, mode: printed?.mode || 'skip' };
  }

  if (job.kind === 'KITCHEN_SEND') {
    const orderRes = await rstOrderApi.get(payload.orderId);
    const printed = await printKitchenTicket({
      order: orderRes.data,
      t,
      onlyItemIds: payload.itemIds || [],
    });
    if (printed?.mode === 'silent') return { ack: true, mode: 'silent' };
    // Leave pending: another desktop may own the station printer.
    return {
      ack: false,
      mode: printed?.mode || 'skip',
      missing: printed?.missing,
      configured: printed?.configured,
      errors: printed?.errors,
    };
  }

  if (job.kind === 'CATEGORY_SLIP') {
    return runCategorySlip(payload, t);
  }

  return { ack: false };
}

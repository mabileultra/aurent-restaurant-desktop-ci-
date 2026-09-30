/**
 * Desktop print relay: run a server print job on this machine if it owns the printer.
 */
import { rstOrderApi } from '../../api/order.api';
import { printGuestBill } from './printGuestBill';
import { printKitchenTicket } from './printKitchenTicket';
import {
  isDesktopPrinter,
  listDesktopPrintersCached,
  printTicketLines,
} from './desktopPrinters';
import { wasGuestBillPrintedLocally } from './restaurantPrintFlush';

function parsePayload(raw) {
  try {
    return typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch {
    return null;
  }
}

async function localHasPrinter(printerName) {
  const name = String(printerName || '').trim();
  if (!name) return false;
  try {
    const list = await listDesktopPrintersCached();
    const names = (Array.isArray(list) ? list : [])
      .map((p) => String(p?.name || p).trim())
      .filter(Boolean);
    const lower = name.toLowerCase();
    return names.some((n) => n === name || n.toLowerCase() === lower);
  } catch {
    return false;
  }
}

/** Warm cache once; avoid serial IPC on every slip. */
let printerNameSetCache = { at: 0, set: null };

async function localHasPrinterFast(printerName) {
  const name = String(printerName || '').trim();
  if (!name) return false;
  const now = Date.now();
  if (!printerNameSetCache.set || now - printerNameSetCache.at > 60_000) {
    try {
      const list = await listDesktopPrintersCached();
      const set = new Set(
        (Array.isArray(list) ? list : [])
          .map((p) => String(p?.name || p).trim().toLowerCase())
          .filter(Boolean),
      );
      printerNameSetCache = { at: now, set };
    } catch {
      return localHasPrinter(name);
    }
  }
  const lower = name.toLowerCase();
  return printerNameSetCache.set.has(lower)
    || [...printerNameSetCache.set].some((n) => n === lower);
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

function batchItemLines(line) {
  return itemLines({
    name: line?.name,
    quantity: line?.quantity,
    portionText: line?.portionText,
    note: line?.note,
    modifiers: line?.modifiers || [],
  });
}

async function runCategorySlip(payload, t) {
  const printer = String(payload.printerName || '').trim();
  if (!(await localHasPrinterFast(printer))) return { mode: 'skip', ack: false };

  // Fast path: payload already has dish text (no second round-trip to order API).
  if (payload.itemName || payload.header) {
    const qty = Number(payload.quantity) || 1;
    await printTicketLines({
      title: payload.categoryName || '',
      printerName: printer,
      lines: [
        payload.header || '',
        new Date().toLocaleString(),
        '---',
        ...itemLines({
          name: payload.itemName,
          quantity: qty,
          portionText: payload.portionText,
          note: payload.note,
          modifiers: payload.modifiers || [],
        }),
      ].filter((line, idx) => idx > 0 || line),
    });
    return { mode: 'silent', ack: true };
  }

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

async function runCategoryBatch(payload) {
  const printer = String(payload.printerName || '').trim();
  if (!(await localHasPrinterFast(printer))) return { mode: 'skip', ack: false };
  const dishLines = (payload.lines || []).flatMap((line, index) => {
    const block = batchItemLines(line);
    return index === 0 ? block : ['', ...block];
  });
  if (!dishLines.length) return { mode: 'skip', ack: true };
  await printTicketLines({
    title: payload.title || '',
    printerName: printer,
    lines: [
      payload.header || '',
      new Date().toLocaleString(),
      '---',
      ...dishLines,
    ].filter((line, idx) => idx > 0 || line),
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
    if (wasGuestBillPrintedLocally(payload.orderId)) {
      return { ack: true, mode: 'silent' };
    }
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
    return {
      ack: false,
      mode: printed?.mode || 'skip',
      missing: printed?.missing,
      configured: printed?.configured,
      errors: printed?.errors,
    };
  }

  if (job.kind === 'CATEGORY_BATCH') {
    return runCategoryBatch(payload);
  }

  if (job.kind === 'CATEGORY_SLIP') {
    return runCategorySlip(payload, t);
  }

  return { ack: false };
}

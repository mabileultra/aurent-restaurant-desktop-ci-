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
import { kitchenTicketMetaLines } from './ticketLayout';
import { resolvePrintWaiterName } from './printWaiterNames';

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

function itemLines(item) {
  const qty = Number(item.quantity) || 0;
  const portion = item.portionText ? ` (${item.portionText})` : '';
  const lines = [`${qty}× ${item.name || ''}${portion}`];
  const mods = (item.modifiers || [])
    .map((m) => (typeof m === 'string' ? m : (m.name || m.optionName || '')))
    .filter(Boolean)
    .join(', ');
  if (mods) lines.push(`   + ${mods}`);
  if (item.note) lines.push(`   * ${item.note}`);
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

async function metaFromPayload(payload, order, t, waiterNameById, storeId) {
  const waiterUserId = payload?.waiterUserId ?? order?.waiterUserId;
  const waiterName = await resolvePrintWaiterName(
    storeId ?? order?.storeId,
    waiterUserId,
    waiterNameById,
  );
  return kitchenTicketMetaLines({
    order,
    header: payload?.header || null,
    waiterName,
    t,
  });
}

async function runCategorySlip(payload, t, waiterNameById, storeId) {
  const printer = String(payload.printerName || '').trim();
  if (!(await localHasPrinterFast(printer))) {
    return { mode: 'skip', ack: false, release: true };
  }

  // Fast path: payload already has dish text (no second round-trip to order API).
  if (payload.itemName || payload.header) {
    const qty = Number(payload.quantity) || 1;
    await printTicketLines({
      title: payload.categoryName || '',
      printerName: printer,
      lines: [
        ...(await metaFromPayload(payload, null, t, waiterNameById, storeId)),
        '---',
        ...itemLines({
          name: payload.itemName,
          quantity: qty,
          portionText: payload.portionText,
          note: payload.note,
          modifiers: payload.modifiers || [],
        }),
        '---',
      ],
    });
    return { mode: 'silent', ack: true, release: false };
  }

  const orderRes = await rstOrderApi.get(payload.orderId);
  const order = orderRes.data;
  const line = (order.items || []).find((item) => String(item.id) === String(payload.orderItemId));
  if (!line) return { mode: 'skip', ack: true, release: false };
  const qty = Number(payload.quantity) || Number(line.quantity) || 1;
  await printTicketLines({
    title: payload.categoryName || '',
    printerName: printer,
    lines: [
      ...(await metaFromPayload(payload, order, t, waiterNameById, storeId ?? order.storeId)),
      '---',
      ...itemLines({ ...line, quantity: qty }),
      '---',
    ],
  });
  return { mode: 'silent', ack: true, release: false };
}

async function runCategoryBatch(payload, t, waiterNameById, storeId) {
  const printer = String(payload.printerName || '').trim();
  if (!(await localHasPrinterFast(printer))) {
    return { mode: 'skip', ack: false, release: true };
  }
  const dishLines = (payload.lines || []).flatMap((line, index) => {
    const block = batchItemLines(line);
    return index === 0 ? block : ['', ...block];
  });
  if (!dishLines.length) return { mode: 'skip', ack: true, release: false };
  await printTicketLines({
    title: payload.title || '',
    printerName: printer,
    lines: [
      ...(await metaFromPayload(payload, null, t, waiterNameById, storeId)),
      '---',
      ...dishLines,
      '---',
    ],
  });
  return { mode: 'silent', ack: true, release: false };
}

/**
 * @returns {Promise<{ ack: boolean, release?: boolean, mode?: string }>}
 */
export async function executeRestaurantPrintJob(job, { t, waiterNameById, storeId } = {}) {
  if (!job || !isDesktopPrinter()) return { ack: false, release: true };
  const payload = parsePayload(job.payload);
  if (!payload) return { ack: true, release: false };

  try {
    if (job.kind === 'GUEST_BILL') {
      if (wasGuestBillPrintedLocally(payload.orderId)) {
        return { ack: true, release: false, mode: 'silent' };
      }
      const orderRes = await rstOrderApi.get(payload.orderId);
      const printed = await printGuestBill({
        order: orderRes.data,
        t,
        waiterNameById,
      });
      if (printed?.mode === 'silent') return { ack: true, release: false, mode: 'silent' };
      // No bill printer on this PC — free the job for the cashier desktop immediately.
      return { ack: false, release: true, mode: printed?.mode || 'skip' };
    }

    if (job.kind === 'KITCHEN_SEND') {
      const orderRes = await rstOrderApi.get(payload.orderId);
      const order = orderRes.data;
      const qtyByItemId = Object.fromEntries(
        (payload.lines || [])
          .filter((row) => row?.itemId != null)
          .map((row) => [String(row.itemId), row.quantity]),
      );
      const waiterName = await resolvePrintWaiterName(
        storeId ?? order?.storeId,
        order?.waiterUserId,
        waiterNameById,
      );
      const printed = await printKitchenTicket({
        order,
        t,
        onlyItemIds: payload.itemIds || (payload.lines || []).map((row) => row.itemId),
        qtyByItemId,
        waiterName,
        waiterNameById,
      });
      if (printed?.mode === 'silent' || printed?.mode === 'partial') {
        // Ack even on partial — re-queue would reprint already-cut stations on another PC.
        return {
          ack: true,
          release: false,
          mode: printed.mode,
          missing: printed?.missing,
          configured: printed?.configured,
          errors: printed?.errors,
        };
      }
      // missing / skip — nothing printed here; free for a desktop that has the printers
      return {
        ack: false,
        release: true,
        mode: printed?.mode || 'skip',
        missing: printed?.missing,
        configured: printed?.configured,
        errors: printed?.errors,
      };
    }

    if (job.kind === 'CATEGORY_BATCH') {
      return await runCategoryBatch(payload, t, waiterNameById, storeId);
    }

    if (job.kind === 'CATEGORY_SLIP') {
      return await runCategorySlip(payload, t, waiterNameById, storeId);
    }

    return { ack: true, release: false };
  } catch (err) {
    // Timeout / worker died mid-job: the slip may already be printing — never reprint automatically.
    if (isUncertainPrintError(err)) return { ack: true, release: false, mode: 'uncertain' };
    // Spooler refused before taking the data — put back for a retry (same or other PC).
    return { ack: false, release: true, mode: 'error' };
  }
}

export function isUncertainPrintError(err) {
  return /таймаут|timeout|worker exited/i.test(String(err?.message || err || ''));
}

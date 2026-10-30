/**
 * Kitchen chit. Silent on the desktop that has a station printer.
 * Waiter browser does not open a print dialog.
 */
import {
  getDesktopPrinterSettings,
  isDesktopPrinter,
  markPrintedKitchenLines,
  printTicketLines,
  readPrintedKitchenLines,
} from './desktopPrinters';
import {
  filterMetaLines,
  resolveTicketTitle,
  ticketPrintOptions,
  wrapSlipLines,
} from '../../shared/printProfile/applyPrintProfile';
import { loadStorePrintProfile } from '../../shared/printProfile/loadStorePrintProfile';
import { styleKitchenDishBlock } from './kitchenDishLines';
import { kitchenChannelTitlePrefix } from './kitchenPlaceLine';
import { kitchenTicketMetaLines } from './ticketLayout';
import { resolvePrintWaiterName } from './printWaiterNames';

async function resolveWaiterName(order, waiterName, waiterNameById) {
  if (waiterName) return waiterName;
  return resolvePrintWaiterName(order?.storeId, order?.waiterUserId, waiterNameById);
}

/** Prefer station binding; if unset / unmapped, use the only configured kitchen printer. */
export function resolveStationPrinter(map, stationId) {
  if (!map || typeof map !== 'object') return '';
  if (stationId != null && String(stationId).trim()) {
    const want = String(stationId).trim().toLowerCase();
    for (const [key, value] of Object.entries(map)) {
      if (String(key).trim().toLowerCase() !== want) continue;
      const name = String(value || '').trim();
      if (name) return name;
    }
  }
  const values = Object.values(map)
    .map((name) => String(name || '').trim())
    .filter(Boolean);
  const unique = [...new Set(values)];
  return unique.length === 1 ? unique[0] : '';
}

async function sendGroups(groups, settings) {
  const map = settings?.stationPrinters || {};
  const configured = Object.keys(map).length > 0;
  const missing = [];
  const errors = [];
  const tasks = [];

  for (const group of groups) {
    const printer = resolveStationPrinter(map, group.stationId);
    if (!printer) {
      missing.push(group.label);
      continue;
    }
    const fresh = group.items.filter((item) => !readPrintedKitchenLines().has(String(item.lineId)));
    if (!fresh.length) continue;
    const slipType = /отказ|void|bekor/i.test(String(group.title || '')) ? 'CANCEL' : 'KITCHEN';
    const profile = group.profile || null;
    const title = resolveTicketTitle(group.title, profile, slipType);
    const meta = filterMetaLines(group.meta, profile, slipType);
    tasks.push(
      printTicketLines({
        title,
        printerName: printer,
        lines: wrapSlipLines([
          ...meta,
          group.label ? `≫ ${group.label}` : '',
          '---',
          ...styleKitchenDishBlock(fresh, profile, slipType),
          '---',
        ].filter(Boolean), profile, slipType),
        ...ticketPrintOptions(profile, slipType),
      })
        .then(() => {
          markPrintedKitchenLines(fresh.map((item) => item.lineId));
          return { ok: true };
        })
        .catch((err) => {
          errors.push(`${group.label}: ${err?.message || 'печать не выполнена'}`);
          return { ok: false };
        }),
    );
  }

  const settled = await Promise.all(tasks);
  const printed = settled.filter((row) => row?.ok).length;

  // Partial: some stations printed here, others still need a printer (this PC or another).
  if (printed && missing.length) {
    return { mode: 'partial', missing, configured, errors };
  }
  if (printed) return { mode: 'silent', missing, configured, errors };
  if (missing.length && !errors.length) return { mode: 'missing', missing, configured, errors };
  return { mode: 'skip', missing, configured, errors };
}

/** Category auto-print: slip goes to the printer named on the section. */
export async function printCategoryTicketOnAdd({
  order, line, quantity, category, t, waiterName, waiterNameById,
} = {}) {
  if (!order || !line || !category?.autoPrint || !isDesktopPrinter()) {
    return { mode: 'skip' };
  }
  const printer = String(category.printPrinterName || '').trim();
  if (!printer) return { mode: 'missing', label: category.name || '' };
  const qty = Number(quantity) || 1;
  const resolvedWaiter = await resolveWaiterName(order, waiterName, waiterNameById);
  const profile = await loadStorePrintProfile(order?.storeId);
  const slipType = 'KITCHEN';
  await printTicketLines({
    title: resolveTicketTitle(category.name || '', profile, slipType),
    printerName: printer,
    lines: wrapSlipLines([
      ...filterMetaLines(kitchenTicketMetaLines({
        order,
        waiterName: resolvedWaiter,
        t,
      }), profile, slipType),
      '---',
      ...styleKitchenDishBlock([{ ...line, quantity: qty }], profile, slipType),
      '---',
    ], profile, slipType),
    ...ticketPrintOptions(profile, slipType),
  });
  return { mode: 'silent' };
}

export async function printKitchenTicket({
  order, t, onlyItemIds, qtyByItemId, noteByItemId, waiterName, waiterNameById, voidSlip = false,
} = {}) {
  if (!order || !isDesktopPrinter() || !onlyItemIds?.length) {
    return { mode: 'skip', missing: [], configured: false };
  }

  const allow = new Set(onlyItemIds.map(String));
  const qtyMap = qtyByItemId instanceof Map
    ? qtyByItemId
    : new Map(Object.entries(qtyByItemId || {}).map(([id, qty]) => [String(id), qty]));
  const noteMap = noteByItemId instanceof Map
    ? noteByItemId
    : new Map(Object.entries(noteByItemId || {}).map(([id, note]) => [String(id), note]));
  const lines = (order.items || []).filter((item) => {
    const status = String(item.itemStatus || '').toUpperCase();
    if (status === 'CANCELLED') return false;
    if (allow && !allow.has(String(item.id))) return false;
    return true;
  });
  if (!lines.length) return { mode: 'skip', missing: [], configured: false };

  const byStation = new Map();
  for (const line of lines) {
    const key = String(line.stationId || 'default');
    if (!byStation.has(key)) {
      byStation.set(key, {
        stationId: line.stationId || null,
        label: line.stationName || t?.('rst.kitchen.defaultStation', { defaultValue: 'Кухня' }) || 'Кухня',
        items: [],
      });
    }
    const qty = qtyMap.has(String(line.id)) ? qtyMap.get(String(line.id)) : line.quantity;
    const note = noteMap.has(String(line.id)) ? noteMap.get(String(line.id)) : line.note;
    const unitPrice = Number(line.unitPrice ?? line.price) || 0;
    byStation.get(key).items.push({
      lineId: `${line.id}:${qty}`,
      name: line.name,
      quantity: qty,
      note,
      modifiers: line.modifiers,
      portionText: line.portionText,
      unitPrice,
      // Printed qty may be a delta — amount = unit × printed qty.
      lineTotal: Math.round(unitPrice * (Number(qty) || 0) * 100) / 100,
    });
  }

  const baseTitle = voidSlip
    ? (t?.('rst.order.cancelPrintTitle', { defaultValue: 'ОТКАЗ' }) || 'ОТКАЗ')
    : (t?.('rst.order.kitchenTicketTitle', { defaultValue: 'Кухонный чек' }) || 'Кухонный чек');
  const title = `${kitchenChannelTitlePrefix(order?.channel, t)}${baseTitle}`;
  const resolvedWaiter = await resolveWaiterName(order, waiterName, waiterNameById);
  const meta = kitchenTicketMetaLines({
    order,
    waiterName: resolvedWaiter,
    t,
  });
  const settings = await getDesktopPrinterSettings();
  const profile = await loadStorePrintProfile(order?.storeId);
  const groups = [...byStation.values()].map((group) => ({
    ...group,
    title,
    meta,
    profile,
    extra: order.clientName || '',
  }));
  return sendGroups(groups, settings);
}

/** KDS machine prints NEW tickets for stations bound on this computer. */
export async function printKitchenBoardTickets(tickets, t, waiterNameById, storeId = null) {
  if (!isDesktopPrinter() || !tickets?.length) return { mode: 'skip' };
  const groups = [];
  for (const ticket of tickets) {
    if (String(ticket.status || '').toUpperCase() !== 'NEW') continue;
    const items = (ticket.lines || [])
      .filter((line) => {
        const key = line.id ? String(line.id) : `${ticket.id}:${line.orderItemId}`;
        return line.orderItemId && !readPrintedKitchenLines().has(key);
      })
      .map((line) => {
        const qty = line.quantity;
        const unitPrice = Number(line.unitPrice ?? line.price) || 0;
        return {
          lineId: line.id ? String(line.id) : `${ticket.id}:${line.orderItemId}`,
          name: line.name,
          quantity: qty,
          note: line.note,
          modifiers: (line.modifiers || []).map((name) => ({ name })),
          portionText: line.portionText,
          unitPrice,
          lineTotal: line.lineTotal != null
            ? Number(line.lineTotal)
            : Math.round(unitPrice * (Number(qty) || 0) * 100) / 100,
        };
      });
    if (!items.length) continue;
    const ticketWithStore = storeId != null && ticket.storeId == null
      ? { ...ticket, storeId }
      : ticket;
    const resolvedWaiter = await resolveWaiterName(ticketWithStore, null, waiterNameById);
    groups.push({
      stationId: ticket.stationId,
      label: ticket.stationName || t?.('rst.kitchen.defaultStation', { defaultValue: 'Кухня' }) || 'Кухня',
      title: `${kitchenChannelTitlePrefix(ticket.channel, t)}${
        t?.('rst.order.kitchenTicketTitle', { defaultValue: 'Кухонный чек' }) || 'Кухонный чек'
      }`,
      meta: kitchenTicketMetaLines({
        order: ticket,
        waiterName: resolvedWaiter,
        t,
      }),
      extra: ticket.clientName || '',
      items,
    });
  }
  if (!groups.length) return { mode: 'skip' };
  const settings = await getDesktopPrinterSettings();
  const profile = await loadStorePrintProfile(storeId);
  return sendGroups(groups.map((group) => ({ ...group, profile })), settings);
}

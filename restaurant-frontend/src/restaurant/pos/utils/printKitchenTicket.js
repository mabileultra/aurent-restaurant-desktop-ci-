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

async function sendGroups(groups, settings) {
  const map = settings?.stationPrinters || {};
  const configured = Object.keys(map).length > 0;
  const missing = [];
  const errors = [];
  let printed = 0;
  for (const group of groups) {
    const printer = group.stationId ? map[String(group.stationId)] : '';
    if (!printer) {
      missing.push(group.label);
      continue;
    }
    const fresh = group.items.filter((item) => !readPrintedKitchenLines().has(String(item.lineId)));
    if (!fresh.length) continue;
    try {
      await printTicketLines({
        title: group.title,
        printerName: printer,
        lines: [
          group.header,
          [new Date().toLocaleString(), group.extra].filter(Boolean).join(' · '),
          group.label,
          '---',
          ...fresh.flatMap(itemLines),
        ],
      });
      markPrintedKitchenLines(fresh.map((item) => item.lineId));
      printed += 1;
    } catch (err) {
      errors.push(`${group.label}: ${err?.message || 'печать не выполнена'}`);
    }
  }
  return { mode: printed ? 'silent' : 'skip', missing, configured, errors };
}

/** Category auto-print: slip goes to that station's printer even if the kitchen board is off. */
export async function printCategoryTicketOnAdd({ order, line, quantity, category, stations, t } = {}) {
  if (!order || !line || !category?.autoPrint || !category.printStationId || !isDesktopPrinter()) {
    return { mode: 'skip' };
  }
  const station = (stations || []).find((item) => String(item.id) === String(category.printStationId));
  const settings = await getDesktopPrinterSettings();
  const printer = settings?.stationPrinters?.[String(category.printStationId)] || '';
  if (!printer) return { mode: 'missing', label: station?.name || category.name || '' };
  const qty = Number(quantity) || 1;
  await printTicketLines({
    title: station?.name || category.name || '',
    printerName: printer,
    lines: [
      headerFor(order, t),
      new Date().toLocaleString(),
      '---',
      ...itemLines({ ...line, quantity: qty }),
    ],
  });
  if (line.id != null) markPrintedKitchenLines([line.id]);
  return { mode: 'silent' };
}

export async function printKitchenTicket({ order, t, onlyItemIds } = {}) {
  if (!order || !isDesktopPrinter() || !onlyItemIds?.length) {
    return { mode: 'skip', missing: [], configured: false };
  }

  const allow = new Set(onlyItemIds.map(String));
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
    byStation.get(key).items.push({
      lineId: line.id,
      name: line.name,
      quantity: line.quantity,
      note: line.note,
      modifiers: line.modifiers,
      portionText: line.portionText,
    });
  }

  const title = t?.('rst.order.kitchenTicketTitle', { defaultValue: 'Кухонный чек' }) || 'Кухонный чек';
  const header = headerFor(order, t);
  const settings = await getDesktopPrinterSettings();
  const groups = [...byStation.values()].map((group) => ({
    ...group,
    title,
    header,
    extra: order.clientName || '',
  }));
  return sendGroups(groups, settings);
}

/** KDS machine prints NEW tickets for stations bound on this computer. */
export async function printKitchenBoardTickets(tickets, t) {
  if (!isDesktopPrinter() || !tickets?.length) return { mode: 'skip' };
  const groups = [];
  for (const ticket of tickets) {
    if (String(ticket.status || '').toUpperCase() !== 'NEW') continue;
    const items = (ticket.lines || [])
      .filter((line) => line.orderItemId && !readPrintedKitchenLines().has(String(line.orderItemId)))
      .map((line) => ({
        lineId: line.orderItemId,
        name: line.name,
        quantity: line.quantity,
        note: line.note,
        modifiers: (line.modifiers || []).map((name) => ({ name })),
        portionText: line.portionText,
      }));
    if (!items.length) continue;
    groups.push({
      stationId: ticket.stationId,
      label: ticket.stationName || t?.('rst.kitchen.defaultStation', { defaultValue: 'Кухня' }) || 'Кухня',
      title: t?.('rst.order.kitchenTicketTitle', { defaultValue: 'Кухонный чек' }) || 'Кухонный чек',
      header: headerFor(ticket, t),
      extra: ticket.clientName || '',
      items,
    });
  }
  if (!groups.length) return { mode: 'skip' };
  const settings = await getDesktopPrinterSettings();
  return sendGroups(groups, settings);
}

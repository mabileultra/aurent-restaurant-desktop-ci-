/**
 * Kitchen chit. Silent on the desktop that has a station printer.
 * Waiter browser does not open a print dialog.
 */
import {
  getDesktopPrinterSettings,
  isDesktopPrinter,
  markPrintedKitchenLines,
  printTicketHtml,
  readPrintedKitchenLines,
} from './desktopPrinters';

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
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

function linesHtml(items) {
  return items.map((item) => {
    const qty = Number(item.quantity) || 0;
    const note = item.note ? `<div>※ ${escapeHtml(item.note)}</div>` : '';
    const mods = (item.modifiers || [])
      .map((m) => (typeof m === 'string' ? m : (m.name || m.optionName || '')))
      .filter(Boolean)
      .map((name) => escapeHtml(name))
      .join(', ');
    const modsHtml = mods ? `<div>+ ${mods}</div>` : '';
    const portion = item.portionText ? ` · ${escapeHtml(item.portionText)}` : '';
    return `<p><strong>${qty}×</strong> ${escapeHtml(item.name || '')}${portion}${modsHtml}${note}</p>`;
  }).join('');
}

function ticketHtml({ title, header, station, items, extra }) {
  return `
    <p><strong>${escapeHtml(title)}</strong></p>
    <p><strong>${escapeHtml(header)}</strong></p>
    <p>${escapeHtml(new Date().toLocaleString())}${extra ? ` · ${escapeHtml(extra)}` : ''}</p>
    <h3>${escapeHtml(station)}</h3>
    ${linesHtml(items)}
  `;
}

async function sendGroups(groups, settings) {
  const map = settings?.stationPrinters || {};
  const configured = Object.keys(map).length > 0;
  const missing = [];
  let printed = 0;
  for (const group of groups) {
    const printer = group.stationId ? map[String(group.stationId)] : '';
    if (!printer) {
      missing.push(group.label);
      continue;
    }
    const fresh = group.items.filter((item) => !readPrintedKitchenLines().has(String(item.lineId)));
    if (!fresh.length) continue;
    markPrintedKitchenLines(fresh.map((item) => item.lineId));
    await printTicketHtml(ticketHtml({
      title: group.title,
      header: group.header,
      station: group.label,
      items: fresh,
      extra: group.extra,
    }), printer);
    printed += 1;
  }
  return { mode: printed ? 'silent' : 'skip', missing, configured };
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

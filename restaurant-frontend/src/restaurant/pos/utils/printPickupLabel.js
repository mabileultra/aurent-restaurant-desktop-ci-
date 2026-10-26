import {
  resolveTicketTitle,
  styleLine,
  ticketPrintOptions,
  wrapSlipLines,
} from '../../shared/printProfile/applyPrintProfile';
import { fieldStyle } from '../../shared/printProfile/printProfileDefaults';
import { printRawLabel, printTicketLines } from './desktopPrinters';
import { buildPickupTspl } from './pickupLabelTspl';

const SLIP = 'PICKUP_LABEL';

function channelLabel(channel, t) {
  const key = String(channel || '').toUpperCase();
  if (key === 'DELIVERY') {
    return t?.('rst.pos.delivery', { defaultValue: 'DELIVERY' }) || 'DELIVERY';
  }
  if (key === 'DINE_IN') {
    return t?.('rst.pos.dineIn', { defaultValue: 'ЗАЛ' }) || 'ЗАЛ';
  }
  return t?.('rst.pos.takeaway', { defaultValue: 'TAKEAWAY' }) || 'TAKEAWAY';
}

export function buildPickupLabelLines({
  channel,
  items = [],
  printedAt,
  t,
  profile,
} = {}) {
  const lines = [];
  if (fieldStyle(profile, SLIP, 'hallTable').on) {
    lines.push(styleLine(channelLabel(channel, t), fieldStyle(profile, SLIP, 'hallTable')));
  }
  if (fieldStyle(profile, SLIP, 'items').on) {
    items.forEach((item) => {
      if (!item || (!item.name && !item.quantity)) return;
      const qty = Number(item.quantity) || 1;
      lines.push(styleLine(
        `${qty}× ${item.name || ''}`.trim(),
        fieldStyle(profile, SLIP, 'items'),
      ));
    });
  }
  if (printedAt && fieldStyle(profile, SLIP, 'time').on) {
    const date = new Date(printedAt);
    if (!Number.isNaN(date.getTime())) {
      const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      lines.push(styleLine(time, fieldStyle(profile, SLIP, 'time')));
    }
  }
  return lines.filter(Boolean);
}

export async function printPickupLabel({
  pickupNo,
  channel,
  items,
  printedAt,
  printerName,
  t,
  profile,
  rawMode,
} = {}) {
  const name = String(printerName || '').trim();
  if (!name) return { mode: 'skip' };
  const body = buildPickupLabelLines({ channel, items, printedAt, t, profile });
  if (rawMode === 'tspl') {
    await printRawLabel(name, buildPickupTspl({ pickupNo, lines: body }));
    return { mode: 'silent' };
  }
  await printTicketLines({
    title: resolveTicketTitle(String(pickupNo || ''), profile, SLIP),
    printerName: name,
    lines: wrapSlipLines(body, profile, SLIP),
    ...ticketPrintOptions(profile, SLIP),
  });
  return { mode: 'silent' };
}

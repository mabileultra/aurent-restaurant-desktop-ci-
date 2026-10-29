import {
  resolveTicketTitle,
  styleLine,
  wrapSlipLines,
} from '../../shared/printProfile/applyPrintProfile';
import { fieldStyle } from '../../shared/printProfile/printProfileDefaults';
import { printRawLabel, printTicketHtml } from './desktopPrinters';
import { buildPickupTspl } from './pickupLabelTspl';

const SLIP = 'PICKUP_LABEL';
/** Stock New Stock / XP-365B queue paperId 257 — 60.9×30.4 mm. */
const LABEL_W_MM = 61;
const LABEL_H_MM = 30;

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

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
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

function pickupLabelHtml(title, lines) {
  const titleHtml = title
    ? `<p style="margin:0 0 4px;text-align:center;font-weight:900;font-size:28px;letter-spacing:0.04em">${escapeHtml(title)}</p>`
    : '';
  const body = (lines || []).map((line) => {
    const raw = String(line ?? '');
    if (raw === '---') {
      return '<hr style="border:none;border-top:1px dashed #000;margin:4px 0"/>';
    }
    return `<p style="white-space:pre;margin:0;font-size:12px">${escapeHtml(raw)}</p>`;
  }).join('');
  return `<div style="font-family:ui-monospace,Consolas,monospace">${titleHtml}${body}</div>`;
}

/**
 * Pickup sticker: Windows GDI (like RestaurantPOS) or RAW TSPL into the same USB queue.
 * Never send ESC/POS here — XP-365B in label mode ignores it and the queue still clears.
 */
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
    await printRawLabel(name, buildPickupTspl({
      pickupNo,
      lines: body,
      widthMm: LABEL_W_MM,
      heightMm: LABEL_H_MM,
    }));
    return { mode: 'silent' };
  }
  const title = resolveTicketTitle(String(pickupNo || ''), profile, SLIP);
  await printTicketHtml(
    pickupLabelHtml(title, wrapSlipLines(body, profile, SLIP)),
    name,
    { paperWmm: LABEL_W_MM, paperHmm: LABEL_H_MM },
  );
  return { mode: 'silent' };
}

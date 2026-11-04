/**
 * Place / channel line for kitchen, category and cancel slips.
 * Counter channels stay visible even when the «Зал · стол» print checkbox is off.
 */

export function isCounterChannel(channel) {
  const ch = String(channel || '').toUpperCase();
  return ch === 'TAKEAWAY' || ch === 'DELIVERY';
}

/** True when a printed meta row is the takeaway/delivery mark (any locale / legacy EN). */
export function isKitchenChannelPlaceLine(text) {
  const s = String(text || '').trim();
  // No \b — JS word boundaries break on Cyrillic.
  return /^(НА ВЫНОС|ДОСТАВКА|TAKEAWAY|DELIVERY)(?=$|[\s·#№])/i.test(s);
}

function orderNoMark(order) {
  const no = order?.orderNo;
  if (no == null || no === '' || no === '—') return '';
  const n = Number(no);
  if (!Number.isFinite(n) || n <= 0) return '';
  return `№${n}`;
}

function counterChannelLabel(channel, t) {
  const ch = String(channel || '').toUpperCase();
  if (ch === 'DELIVERY') {
    return t?.('rst.pos.delivery', { defaultValue: 'ДОСТАВКА' }) || 'ДОСТАВКА';
  }
  return t?.('rst.pos.takeaway', { defaultValue: 'НА ВЫНОС' }) || 'НА ВЫНОС';
}

/**
 * Rebuild legacy English headers from print jobs so slips stay localized.
 * @returns {string|null} null = keep header as-is (dine-in place line)
 */
export function normalizeKitchenHeader(header, order, t) {
  const raw = String(header || '').trim();
  if (!raw) return null;
  if (isKitchenChannelPlaceLine(raw) || isCounterChannel(order?.channel)) {
    const fromHeader = /^DELIVERY/i.test(raw) || /^ДОСТАВКА/i.test(raw)
      ? 'DELIVERY'
      : (/^TAKEAWAY/i.test(raw) || /^НА ВЫНОС/i.test(raw) ? 'TAKEAWAY' : null);
    return formatKitchenPlaceLine({
      order: { ...order, channel: order?.channel || fromHeader || 'TAKEAWAY' },
      t,
    });
  }
  return null;
}

/**
 * @returns {string}
 */
export function formatKitchenPlaceLine({ order, t } = {}) {
  const channel = String(order?.channel || 'DINE_IN').toUpperCase();
  const mark = orderNoMark(order);

  if (channel === 'TAKEAWAY' || channel === 'DELIVERY') {
    const label = counterChannelLabel(channel, t).toUpperCase();
    const parts = [label];
    if (mark) parts.push(mark);
    const name = String(order?.clientName || '').trim();
    if (name) parts.push(name);
    return parts.join(' · ');
  }

  const code = order?.tableCode || '—';
  const hall = order?.hallName || null;
  const place = hall
    ? (t?.('rst.order.ticketTitle', {
      code,
      hall,
      defaultValue: `${hall} · Стол ${code}`,
    }) || `${hall} · Стол ${code}`)
    : (t?.('rst.order.tableHeading', {
      code,
      defaultValue: `Стол ${code}`,
    }) || `Стол ${code}`);
  if (mark && !String(place).includes(mark)) return `${place} · ${mark}`;
  return place;
}

/** Extra lines under the place row (delivery only). */
export function kitchenChannelDetailLines(order) {
  if (String(order?.channel || '').toUpperCase() !== 'DELIVERY') return [];
  const out = [];
  const phone = String(order?.clientPhone || '').trim();
  const address = String(order?.deliveryAddress || '').trim();
  if (phone) out.push(phone);
  if (address) out.push(address);
  return out;
}

export function kitchenChannelTitlePrefix(channel, t) {
  if (!isCounterChannel(channel)) return '';
  return `${counterChannelLabel(channel, t).toUpperCase()} · `;
}

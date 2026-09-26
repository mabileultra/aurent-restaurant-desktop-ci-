/**
 * Internal kitchen chit (not fiscal). Auto-print after send-to-kitchen.
 * Same path for waiter floor and cashier.
 */
import '../styles/kitchen-ticket-print.css';

const HOST_ID = 'rst-kitchen-ticket-print-host';

/**
 * @param {{ order: object, t?: Function, onlyItemIds?: Array<string|number> }} opts
 */
export async function printKitchenTicket({ order, t, onlyItemIds } = {}) {
  if (typeof window === 'undefined' || !order) return { mode: 'skip' };

  const allow = onlyItemIds?.length
    ? new Set(onlyItemIds.map(String))
    : null;

  const lines = (order.items || []).filter((item) => {
    const status = String(item.itemStatus || '').toUpperCase();
    if (status === 'CANCELLED' || status === 'NEW') return false;
    if (allow && !allow.has(String(item.id))) return false;
    return true;
  });
  if (lines.length === 0) return { mode: 'skip' };

  const byStation = new Map();
  for (const line of lines) {
    const key = line.stationId || line.stationName || 'default';
    const label = line.stationName
      || t?.('rst.kitchen.defaultStation', { defaultValue: 'Кухня' })
      || 'Кухня';
    if (!byStation.has(key)) byStation.set(key, { label, items: [] });
    byStation.get(key).items.push(line);
  }

  const channel = order.channel || 'DINE_IN';
  const header = channel === 'TAKEAWAY'
    ? `TAKEAWAY #${order.orderNo}`
    : channel === 'DELIVERY'
      ? `DELIVERY #${order.orderNo}`
      : (t?.('rst.order.tableHeading', {
        code: order.tableCode || '—',
        defaultValue: `Стол ${order.tableCode || '—'}`,
      }) || `TABLE ${order.tableCode || '—'}`) + ` #${order.orderNo}`;

  const title = t?.('rst.order.kitchenTicketTitle', { defaultValue: 'Кухонный чек' }) || 'Кухонный чек';
  const when = new Date().toLocaleString();

  const sectionsHtml = [...byStation.values()].map((group) => {
    const rows = group.items.map((item) => {
      const qty = Number(item.quantity) || 0;
      const note = item.note
        ? `<div class="rst-kds-print__note">※ ${escapeHtml(item.note)}</div>`
        : '';
      const mods = (item.modifiers || [])
        .map((m) => escapeHtml(m.name || m.optionName || ''))
        .filter(Boolean)
        .join(', ');
      const modsHtml = mods
        ? `<div class="rst-kds-print__note">+ ${mods}</div>`
        : '';
      const portion = item.portionText ? ` · ${escapeHtml(item.portionText)}` : '';
      return `<div class="rst-kds-print__line"><strong>${qty}×</strong> ${escapeHtml(item.name || '')}${portion}${modsHtml}${note}</div>`;
    }).join('');
    return `<h3 class="rst-kds-print__station">${escapeHtml(group.label)}</h3>${rows}`;
  }).join('');

  document.getElementById(HOST_ID)?.remove();

  const host = document.createElement('div');
  host.id = HOST_ID;
  host.setAttribute('aria-hidden', 'true');
  host.innerHTML = `
    <div class="rst-kds-print">
      <p class="rst-kds-print__title">${escapeHtml(title)}</p>
      <p class="rst-kds-print__header"><strong>${escapeHtml(header)}</strong></p>
      <p class="rst-kds-print__meta">${escapeHtml(when)}${order.clientName ? ` · ${escapeHtml(order.clientName)}` : ''}</p>
      ${sectionsHtml}
    </div>`;
  document.body.appendChild(host);

  try {
    await printInternalTicket(host);
    return { mode: 'dialog' };
  } finally {
    window.setTimeout(() => {
      try { host.remove(); } catch { /* ignore */ }
    }, 800);
  }
}

function printInternalTicket(host) {
  return new Promise((resolve) => {
    const iframe = document.createElement('iframe');
    iframe.setAttribute('aria-hidden', 'true');
    iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;opacity:0;pointer-events:none';
    document.body.appendChild(iframe);

    const frameWindow = iframe.contentWindow;
    const frameDoc = frameWindow?.document;
    if (!frameDoc) {
      iframe.remove();
      resolve('skip');
      return;
    }

    const bodyHtml = host.innerHTML;
    frameDoc.open();
    frameDoc.write(`<!doctype html><html><head><title>KDS</title>
      <style>
        @page { margin: 4mm; }
        body { margin: 0; font-family: ui-monospace, Menlo, Consolas, monospace; color: #000; font-size: 13px; line-height: 1.4; }
        .rst-kds-print__title { margin: 0 0 6px; font-size: 15px; font-weight: 800; text-transform: uppercase; }
        .rst-kds-print__header { margin: 0 0 4px; font-size: 14px; }
        .rst-kds-print__meta { margin: 0 0 10px; font-size: 11px; }
        .rst-kds-print__station { margin: 10px 0 4px; padding-bottom: 3px; border-bottom: 1px solid #000; font-size: 12px; text-transform: uppercase; }
        .rst-kds-print__line { margin: 5px 0; }
        .rst-kds-print__note { font-size: 11px; opacity: .8; }
      </style></head><body>${bodyHtml}</body></html>`);
    frameDoc.close();

    const done = () => {
      try { iframe.remove(); } catch { /* ignore */ }
      resolve('dialog');
    };

    const trigger = () => {
      try {
        frameWindow.focus();
        frameWindow.print();
      } finally {
        window.setTimeout(done, 600);
      }
    };

    if (frameDoc.readyState === 'complete') {
      window.setTimeout(trigger, 50);
    } else {
      iframe.onload = () => window.setTimeout(trigger, 50);
      window.setTimeout(trigger, 300);
    }
  });
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

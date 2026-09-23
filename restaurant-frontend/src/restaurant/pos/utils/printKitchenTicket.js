/**
 * Browser print for a kitchen ticket / chit after send-to-kitchen.
 * Desktop ESC/POS kitchen printers can hook later; window.print is enough for pilot.
 */
export function printKitchenTicket({ order, t }) {
  if (!order) return;

  const lines = (order.items || []).filter((item) => {
    const status = String(item.itemStatus || '').toUpperCase();
    return status !== 'CANCELLED' && status !== 'NEW';
  });
  if (lines.length === 0) return;

  const byStation = new Map();
  for (const line of lines) {
    const key = line.stationId || line.stationName || 'default';
    const label = line.stationName || t?.('rst.kitchen.defaultStation', { defaultValue: 'Кухня' });
    if (!byStation.has(key)) byStation.set(key, { label, items: [] });
    byStation.get(key).items.push(line);
  }

  const channel = order.channel || 'DINE_IN';
  const header = channel === 'TAKEAWAY'
    ? `TAKEAWAY #${order.orderNo}`
    : channel === 'DELIVERY'
      ? `DELIVERY #${order.orderNo}`
      : `TABLE ${order.tableCode || '—'} #${order.orderNo}`;

  const sections = [...byStation.values()].map((group) => {
    const rows = group.items.map((item) => {
      const qty = Number(item.quantity) || 0;
      const note = item.note ? `<div style="font-size:12px;opacity:.75">※ ${escapeHtml(item.note)}</div>` : '';
      const mods = (item.modifiers || [])
        .map((m) => escapeHtml(m.name || m.optionName || ''))
        .filter(Boolean)
        .join(', ');
      const modsHtml = mods ? `<div style="font-size:12px;opacity:.75">+ ${mods}</div>` : '';
      return `<div style="margin:6px 0"><strong>${qty}×</strong> ${escapeHtml(item.name || '')}${modsHtml}${note}</div>`;
    }).join('');
    return `<h3 style="margin:14px 0 6px;border-bottom:1px solid #000;padding-bottom:4px">${escapeHtml(group.label)}</h3>${rows}`;
  }).join('');

  const html = `<!doctype html><html><head><title>KDS ${escapeHtml(header)}</title>
    <style>
      body{font-family:ui-monospace,Menlo,monospace;padding:16px;color:#000}
      h1{font-size:18px;margin:0 0 8px}
      .meta{font-size:12px;margin-bottom:12px}
    </style></head><body>
    <h1>${escapeHtml(header)}</h1>
    <div class="meta">${new Date().toLocaleString()}${order.clientName ? ` · ${escapeHtml(order.clientName)}` : ''}</div>
    ${sections}
    <script>window.onload=()=>{window.print();setTimeout(()=>window.close(),300)}</script>
    </body></html>`;

  const win = window.open('', '_blank', 'noopener,noreferrer,width=420,height=640');
  if (!win) return;
  win.document.open();
  win.document.write(html);
  win.document.close();
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

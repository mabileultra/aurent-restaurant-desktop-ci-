import { fmtMoneyCompact } from '../../../utils/formatMoney';

const TICKET_WIDTH = 32;

function padRow(left, right, width = TICKET_WIDTH) {
  const L = String(left ?? '').trimEnd();
  const R = String(right ?? '').trim();
  if (!R) return L;
  if (!L) return R.padStart(width);
  const maxLeft = Math.max(1, width - R.length - 1);
  const clipped = L.length > maxLeft ? `${L.slice(0, Math.max(1, maxLeft - 1))}…` : L;
  const gap = Math.max(1, width - clipped.length - R.length);
  return `${clipped}${' '.repeat(gap)}${R}`;
}

function ticketStamp(iso) {
  const d = iso ? new Date(iso) : new Date();
  if (!Number.isFinite(d.getTime())) return new Date().toLocaleString();
  return d.toLocaleString();
}

function fmtQty(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '0';
  const rounded = Math.round(n * 1000) / 1000;
  return String(rounded);
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Non-fiscal slip printed on shift close: every product sold during the shift.
 * @param {{ report: object, t?: Function }} opts
 */
export function buildShiftItemsReceiptLines({ report, t } = {}) {
  const items = Array.isArray(report?.items) ? report.items : [];
  const title = t?.('pos.shiftItemsTitle') || 'Продано за смену';
  const totalQty = items.reduce((sum, row) => sum + (Number(row.quantity) || 0), 0);
  const totalAmount = items.reduce((sum, row) => sum + (Number(row.amount) || 0), 0);
  const store = report?.storeName || '';
  const cashier = report?.cashierName || '';
  const period = `${ticketStamp(report?.openedAt)} — ${ticketStamp(report?.reportAt)}`;
  const totalLabel = t?.('pos.shiftItemsTotal') || 'ИТОГО';
  const qtyLabel = t?.('pos.shiftItemsQty', { count: fmtQty(totalQty) }) || `${fmtQty(totalQty)} шт.`;
  const emptyLabel = t?.('pos.shiftItemsEmpty') || 'Продаж нет';
  const divider = '-'.repeat(TICKET_WIDTH);
  const lines = [
    title.toUpperCase(),
    ...(store ? [store] : []),
    ...(cashier ? [cashier] : []),
    period,
    divider,
    ...(items.length
      ? items.map((row) => padRow(`${fmtQty(row.quantity)} x ${row.name}`, fmtMoneyCompact(row.amount)))
      : [emptyLabel]),
    divider,
    padRow(totalLabel, qtyLabel),
    padRow('', fmtMoneyCompact(totalAmount)),
  ];
  return { title, lines, items, totalQty, totalAmount, store, cashier, period, totalLabel, qtyLabel, emptyLabel };
}

async function printDesktop(title, lines) {
  const desk = typeof window !== 'undefined' ? window.desktopCashier : null;
  if (!desk?.isDesktop || typeof desk.getPrinterSettings !== 'function') return false;
  const settings = await desk.getPrinterSettings();
  const printerName = settings?.receiptPrinterName || '';
  if (!printerName) return false;
  const payload = {
    printerName,
    title: title || '',
    lines,
    paperWmm: /58/.test(printerName) ? 58 : 80,
    locale: (typeof document !== 'undefined' && document.documentElement.lang) || 'ru',
  };
  if (typeof desk.printPlainEscpos === 'function') {
    await desk.printPlainEscpos(payload);
    return true;
  }
  if (typeof desk.printTicketHtml === 'function') {
    const html = lines.map((line) => `<p>${escapeHtml(line)}</p>`).join('');
    await desk.printTicketHtml({ html, printerName });
    return true;
  }
  return false;
}

function printViaIframe(bodyHtml) {
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
    frameDoc.open();
    frameDoc.write(`<!doctype html><html><head><title>Receipt</title>
      <style>
        @page { margin: 4mm; }
        body { margin: 0; font-family: ui-monospace, Menlo, Consolas, monospace; color: #000; font-size: 12px; line-height: 1.35; }
        .pos-items-print__title { margin: 0 0 6px; font-size: 16px; font-weight: 800; text-align: center; letter-spacing: 0.04em; }
        .pos-items-print__store { margin: 0 0 4px; text-align: center; font-weight: 700; }
        .pos-items-print__meta { margin: 2px 0; font-size: 11px; }
        .pos-items-print__row { display: flex; justify-content: space-between; gap: 8px; margin: 3px 0; }
        .pos-items-print__row--grand { margin-top: 6px; font-size: 15px; font-weight: 900; }
        hr { border: 0; border-top: 1px dashed #000; margin: 8px 0; }
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
    if (frameDoc.readyState === 'complete') window.setTimeout(trigger, 50);
    else iframe.onload = () => window.setTimeout(trigger, 50);
  });
}

/**
 * @param {{ report: object, storeName?: string, cashierName?: string, t?: Function }} opts
 */
export async function printShiftItemsReceipt({ report, storeName, cashierName, t } = {}) {
  if (typeof window === 'undefined' || !report) return { mode: 'skip' };
  const view = buildShiftItemsReceiptLines({
    report: {
      ...report,
      storeName: report.storeName || storeName || '',
      cashierName: report.cashierName || cashierName || '',
    },
    t,
  });
  if (await printDesktop(view.title, view.lines)) return { mode: 'silent' };

  const rowsHtml = view.items.length
    ? view.items.map((row) => (
      `<div class="pos-items-print__row"><span>${escapeHtml(`${fmtQty(row.quantity)} × ${row.name}`)}</span><strong>${fmtMoneyCompact(row.amount)}</strong></div>`
    )).join('')
    : `<p>${escapeHtml(view.emptyLabel)}</p>`;

  await printViaIframe(`
    <div class="pos-items-print">
      <p class="pos-items-print__title">${escapeHtml(view.title)}</p>
      ${view.store ? `<p class="pos-items-print__store">${escapeHtml(view.store)}</p>` : ''}
      ${view.cashier ? `<p class="pos-items-print__meta">${escapeHtml(view.cashier)}</p>` : ''}
      <p class="pos-items-print__meta">${escapeHtml(view.period)}</p>
      <hr />
      ${rowsHtml}
      <hr />
      <div class="pos-items-print__row pos-items-print__row--grand"><span>${escapeHtml(view.totalLabel)} · ${escapeHtml(view.qtyLabel)}</span><strong>${fmtMoneyCompact(view.totalAmount)}</strong></div>
    </div>`);
  return { mode: 'dialog' };
}

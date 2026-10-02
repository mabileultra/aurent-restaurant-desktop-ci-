/**
 * Ordinary (non-fiscal) guest receipt for cashier when Multikassa is off.
 * Browser print only — no OFD / Multikassa / ESC/POS fiscal path.
 * Restaurant pay flow does not call this; reprint is from paid-receipt UI.
 */
import { fmtMoneyCompact } from '../../../utils/formatMoney';
import { resolveReceiptQrValue } from '../../../utils/fiscalReceiptFormat';
import {
  getDesktopPrinterSettings,
  isDesktopPrinter,
  printTicketLines,
} from './desktopPrinters';
import { buildRestaurantTicketBody, formatTicketItemLines } from './buildRestaurantTicketBody';
import { ticketStamp } from './ticketLayout';

const HOST_ID = 'rst-ordinary-sale-print-host';

function isFiscalizedSale(sale) {
  const status = String(sale?.fiscalStatus || '').toUpperCase();
  return status === 'FISCALIZED'
    || Boolean(sale?.fiscalSign)
    || Boolean(sale?.multikassaSaleId)
    || Boolean(sale?.fiscalQrUrl);
}

/**
 * @param {{ sale: object, t?: Function, shift?: object|null }} opts
 */
export async function printOrdinarySaleReceipt({ sale, t, shift = null } = {}) {
  if (typeof window === 'undefined' || !sale) return { mode: 'skip' };

  const title = t?.('rst.order.receiptTitle', { defaultValue: 'Чек' }) || 'Чек';
  const qrValue = isFiscalizedSale(sale) ? resolveReceiptQrValue(sale) : '';
  const textLines = buildRestaurantTicketBody({
    kind: 'sale',
    sale,
    t,
    shift,
    paymentMethod: sale.paymentMethod,
    qrValue,
  });

  if (isDesktopPrinter()) {
    const settings = await getDesktopPrinterSettings();
    const printer = settings?.receiptPrinterName || '';
    if (printer) {
      await printTicketLines({ title, lines: textLines, printerName: printer });
      return { mode: 'silent', fiscal: false };
    }
  }

  const when = sale.createdAt ? ticketStamp(sale.createdAt) : ticketStamp();
  const itemHtml = (sale.items || [])
    .filter((row) => !row.isServiceLine)
    .map((item) => {
      const rows = formatTicketItemLines(item);
      return `<div class="rst-ord-print__line">${rows.map((row) => `<div>${escapeHtml(row)}</div>`).join('')}</div>`;
    })
    .join('');

  const service = Number(sale.serviceAmount) || 0;
  const discount = Number(sale.discountTotal ?? sale.orderDiscountAmount) || 0;
  const subtotal = Number(sale.subtotal) || 0;
  const totalAmount = Number(sale.totalAmount) || 0;
  const vat = Number(sale.taxTotal) || 0;
  const method = String(sale.paymentMethod || 'CASH').toUpperCase();
  const methodLabel = method === 'CARD'
    ? (t?.('sales.paymentCard', { defaultValue: 'Карта' }) || 'Карта')
    : method === 'MIXED'
      ? (t?.('salesLedger.filters.mixed', { defaultValue: 'Смешанная' }) || 'Смешанная')
      : (t?.('sales.paymentCash', { defaultValue: 'Наличные' }) || 'Наличные');
  const withoutService = Math.max(0, subtotal - discount);

  document.getElementById(HOST_ID)?.remove();
  const host = document.createElement('div');
  host.id = HOST_ID;
  host.setAttribute('aria-hidden', 'true');
  host.innerHTML = `
    <div class="rst-ord-print">
      <p class="rst-ord-print__title">${escapeHtml(title)}</p>
      ${sale.storeName ? `<p class="rst-ord-print__store">${escapeHtml(sale.storeName)}</p>` : ''}
      <p class="rst-ord-print__meta">№${escapeHtml(sale.receiptNumber || sale.id || '—')} · ${escapeHtml(when)}</p>
      ${sale.customerName ? `<p class="rst-ord-print__meta">${escapeHtml(sale.customerName)}</p>` : ''}
      ${sale.cashierName || sale.employeeName ? `<p class="rst-ord-print__meta">${escapeHtml(
        t?.('fiscalReceipt.cashier', { defaultValue: 'Кассир' }) || 'Кассир',
      )}: ${escapeHtml(sale.cashierName || sale.employeeName)}</p>` : ''}
      <hr />
      ${itemHtml || `<p>${escapeHtml(t?.('rst.order.emptyLines', { defaultValue: 'Нет позиций' }) || 'Нет позиций')}</p>`}
      <hr />
      <div class="rst-ord-print__row"><span>${escapeHtml(t?.('rst.order.subtotalShort', { defaultValue: 'Подытог' }) || 'Подытог')}</span><strong>${fmtMoneyCompact(subtotal)}</strong></div>
      ${service > 0 ? `<div class="rst-ord-print__row"><span>${escapeHtml(t?.('rst.order.serviceShort', { defaultValue: 'Обслуживание' }) || 'Обслуживание')}</span><strong>${fmtMoneyCompact(service)}</strong></div>` : ''}
      ${discount > 0 ? `<div class="rst-ord-print__row"><span>${escapeHtml(t?.('rst.order.discount', { defaultValue: 'Скидка' }) || 'Скидка')}</span><strong>−${fmtMoneyCompact(discount)}</strong></div>` : ''}
      <div class="rst-ord-print__row"><span>${escapeHtml(t?.('rst.order.paymentFormLine', { method: methodLabel, defaultValue: `Форма оплаты: ${methodLabel}` }) || `Форма оплаты: ${methodLabel}`)}</span></div>
      ${vat > 0 ? `<div class="rst-ord-print__row"><span>${escapeHtml(t?.('rst.order.vatShort', { defaultValue: 'НДС' }) || 'НДС')}</span><strong>${fmtMoneyCompact(vat)}</strong></div>` : ''}
      ${service > 0 ? `<div class="rst-ord-print__row"><span>${escapeHtml(t?.('rst.order.withoutService', { defaultValue: 'Без обслуживания' }) || 'Без обслуживания')}</span><strong>${fmtMoneyCompact(withoutService)}</strong></div>` : ''}
      <div class="rst-ord-print__row rst-ord-print__row--grand"><span>${escapeHtml(t?.('rst.order.totalDue', { defaultValue: 'ИТОГО' }) || 'ИТОГО')}</span><strong>${fmtMoneyCompact(totalAmount)}</strong></div>
      ${Number(sale.changeGiven) > 0 ? `<div class="rst-ord-print__row"><span>${escapeHtml(t?.('fiscalReceipt.change', { defaultValue: 'Сдача' }) || 'Сдача')}</span><strong>${fmtMoneyCompact(sale.changeGiven)}</strong></div>` : ''}
      ${qrValue ? `<p class="rst-ord-print__meta">${escapeHtml(t?.('rst.order.ofdQrHint', { defaultValue: 'ОФД / QR' }) || 'ОФД / QR')}</p><p class="rst-ord-print__meta">${escapeHtml(qrValue)}</p>` : ''}
      <p class="rst-ord-print__footer">${escapeHtml(t?.('rst.order.billFooter', { defaultValue: 'Спасибо за визит!' }) || 'Спасибо за визит!')}</p>
    </div>`;

  document.body.appendChild(host);

  try {
    await printViaIframe(host.innerHTML);
    return { mode: 'dialog', fiscal: false };
  } finally {
    window.setTimeout(() => {
      try { host.remove(); } catch { /* ignore */ }
    }, 800);
  }
}

export function saleNeedsFiscalPrint(sale) {
  return isFiscalizedSale(sale);
}

export function printViaIframe(bodyHtml) {
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
        .rst-ord-print__title { margin: 0 0 6px; font-size: 16px; font-weight: 800; text-align: center; letter-spacing: 0.04em; }
        .rst-ord-print__store { margin: 0 0 4px; text-align: center; font-weight: 700; }
        .rst-ord-print__meta { margin: 2px 0; font-size: 11px; }
        .rst-ord-print__line { margin: 6px 0; }
        .rst-ord-print__row { display: flex; justify-content: space-between; gap: 8px; margin: 3px 0; }
        .rst-ord-print__row--grand { margin-top: 6px; font-size: 15px; font-weight: 900; }
        .rst-ord-print__footer { margin: 10px 0 0; text-align: center; font-size: 11px; }
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
    if (frameDoc.readyState === 'complete') {
      window.setTimeout(trigger, 50);
    } else {
      iframe.onload = () => window.setTimeout(trigger, 50);
    }
  });
}

export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

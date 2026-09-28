/**
 * Guest pre-check when the bill is requested. Silent on this computer's bill printer.
 */
import { fmtMoneyCompact } from '../../../utils/formatMoney';
import {
  getDesktopPrinterSettings,
  isDesktopPrinter,
  printTicketHtml,
} from './desktopPrinters';

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export async function printGuestBill({ order, t } = {}) {
  if (!order || !isDesktopPrinter()) return { mode: 'skip' };
  const settings = await getDesktopPrinterSettings();
  const printer = settings?.billPrinterName || settings?.receiptPrinterName || '';
  if (!printer) return { mode: 'missing' };

  const title = t?.('rst.order.requestBill', { defaultValue: 'Счёт' }) || 'Счёт';
  const lines = (order.items || [])
    .filter((item) => String(item.itemStatus || '').toUpperCase() !== 'CANCELLED')
    .map((item) => {
      const qty = Number(item.quantity) || 0;
      const total = fmtMoneyCompact(item.lineTotal ?? 0);
      return `<p><strong>${qty}×</strong> ${escapeHtml(item.name || '')} · ${total}</p>`;
    })
    .join('');
  const place = order.tableCode
    ? (t?.('rst.order.tableHeading', { code: order.tableCode, defaultValue: `Стол ${order.tableCode}` }) || order.tableCode)
    : (order.clientName || '');
  const html = `
    <p><strong>${escapeHtml(title)}</strong></p>
    <p>${escapeHtml(place)} #${escapeHtml(order.orderNo || '')}</p>
    <p>${escapeHtml(new Date().toLocaleString())}</p>
    ${lines}
    <p><strong>${escapeHtml(t?.('rst.order.totalDue', { defaultValue: 'Итого' }) || 'Итого')} ${fmtMoneyCompact(order.total ?? order.totalDue ?? order.subtotal ?? 0)}</strong></p>
  `;
  await printTicketHtml(html, printer);
  return { mode: 'silent' };
}

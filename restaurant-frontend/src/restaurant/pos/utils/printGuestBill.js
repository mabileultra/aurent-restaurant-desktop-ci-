/**
 * Guest pre-check when the bill is requested. Silent on this computer's bill printer.
 */
import { fmtMoneyCompact } from '../../../utils/formatMoney';
import { resolveRestaurantPayTotal, resolveServicePreview } from './restaurantPayAmount';
import {
  getDesktopPrinterSettings,
  isDesktopPrinter,
  printTicketLines,
} from './desktopPrinters';

export async function printGuestBill({ order, t } = {}) {
  if (!order || !isDesktopPrinter()) return { mode: 'skip' };
  const settings = await getDesktopPrinterSettings();
  const printer = settings?.billPrinterName || '';
  if (!printer) return { mode: 'missing' };

  const title = t?.('rst.order.requestBill', { defaultValue: 'Счёт' }) || 'Счёт';
  const place = order.tableCode
    ? (t?.('rst.order.tableHeading', { code: order.tableCode, defaultValue: `Стол ${order.tableCode}` }) || order.tableCode)
    : (order.clientName || '');
  const totalLabel = t?.('rst.order.totalDue', { defaultValue: 'Итого' }) || 'Итого';
  const service = resolveServicePreview(order);
  const serviceLine = service.amount > 0
    ? `${t?.('rst.order.serviceLine', { percent: service.percent, defaultValue: `Обслуживание ${service.percent}%` }) || `Обслуживание ${service.percent}%`} ${fmtMoneyCompact(service.amount)}`
    : null;
  await printTicketLines({
    title,
    printerName: printer,
    lines: [
      `${place} #${order.orderNo || ''}`.trim(),
      new Date().toLocaleString(),
      '---',
      ...(order.items || [])
        .filter((item) => String(item.itemStatus || '').toUpperCase() !== 'CANCELLED')
        .map((item) => `${Number(item.quantity) || 0} x ${item.name || ''} · ${fmtMoneyCompact(item.lineTotal ?? 0)}`),
      '---',
      ...(serviceLine ? [serviceLine] : []),
      `${totalLabel} ${fmtMoneyCompact(resolveRestaurantPayTotal(order, service))}`,
    ],
  });
  return { mode: 'silent' };
}

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
import { moneyRow, qtyNameRow, ticketStamp } from './ticketLayout';

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
  const items = (order.items || [])
    .filter((item) => String(item.itemStatus || '').toUpperCase() !== 'CANCELLED');

  const body = [];
  if (place || order.orderNo != null) {
    body.push(`${place}${order.orderNo != null ? ` · №${order.orderNo}` : ''}`.trim());
  }
  body.push(ticketStamp());
  body.push('---');
  for (const item of items) {
    body.push(qtyNameRow(item.quantity, item.name));
    const mods = (item.modifiers || [])
      .map((m) => (typeof m === 'string' ? m : (m.name || '')))
      .filter(Boolean);
    if (mods.length) body.push(`  + ${mods.join(', ')}`);
    if (item.note) body.push(`  * ${item.note}`);
    body.push(moneyRow('  ', item.lineTotal ?? 0));
  }
  body.push('---');
  if (service.amount > 0) {
    body.push(moneyRow(
      t?.('rst.order.serviceLine', { percent: service.percent, defaultValue: `Обслуживание ${service.percent}%` })
        || `Обслуживание ${service.percent}%`,
      service.amount,
    ));
  }
  const discount = Number(order.discountAmount) || 0;
  if (discount > 0) {
    body.push(moneyRow(t?.('rst.order.discount', { defaultValue: 'Скидка' }) || 'Скидка', -discount));
  }
  body.push(moneyRow(totalLabel, resolveRestaurantPayTotal(order, service)));
  body.push('---');
  body.push(t?.('rst.order.billFooter', { defaultValue: 'Спасибо за визит!' }) || 'Спасибо за визит!');

  await printTicketLines({
    title,
    printerName: printer,
    lines: body,
  });
  return { mode: 'silent' };
}

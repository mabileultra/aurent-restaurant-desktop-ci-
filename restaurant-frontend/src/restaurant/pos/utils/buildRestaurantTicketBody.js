/**
 * Shared guest bill / ordinary receipt text lines for thermal printers.
 * Items: "Name  qty×price = total" (wrap if too long). VAT only in footer.
 */
import { fmtMoneyCompact } from '../../../utils/formatMoney';
import { extractVatFromInclusive, round2 } from '../../../utils/taxAmounts';
import { resolveRestaurantPayTotal, resolveServicePreview } from './restaurantPayAmount';
import { moneyRow, padRow, TICKET_WIDTH, ticketStamp } from './ticketLayout';

function fmtQty(qty) {
  const n = Number(qty) || 0;
  if (Number.isInteger(n) || Math.abs(n - Math.round(n)) < 0.0005) return String(Math.round(n));
  return String(Math.round(n * 1000) / 1000);
}

/** One item → 1–2 body lines (no per-line VAT). */
export function formatTicketItemLines(item, width = TICKET_WIDTH) {
  const name = String(item?.name || item?.productName || '').trim() || '—';
  const qty = fmtQty(item?.quantity);
  const unit = fmtMoneyCompact(item?.unitPrice ?? item?.price ?? 0);
  const total = fmtMoneyCompact(item?.lineTotal ?? item?.total ?? 0);
  const money = `${qty}×${unit} = ${total}`;
  const single = `${name}  ${money}`;
  const out = [];
  if (single.length <= width) {
    out.push(single);
  } else {
    out.push(name.slice(0, width));
    out.push(money.length <= width ? money : money.slice(0, width));
  }
  const mods = (item?.modifiers || [])
    .map((m) => (typeof m === 'string' ? m : (m.name || m.optionName || '')))
    .filter(Boolean);
  if (mods.length) out.push(`  + ${mods.join(', ')}`.slice(0, width));
  if (item?.note) out.push(`  * ${item.note}`.slice(0, width));
  return out;
}

function vatTotalFromItems(items) {
  return round2((items || []).reduce((sum, item) => {
    const lineTotal = Number(item.lineTotal ?? item.total) || 0;
    const rate = Number(item.taxRate ?? item.taxRatePercent) || 0;
    const tax = item.taxAmount != null
      ? Number(item.taxAmount) || 0
      : extractVatFromInclusive(lineTotal, rate);
    return sum + tax;
  }, 0));
}

function paymentMethodLabel(method, t) {
  const m = String(method || 'CASH').toUpperCase();
  if (m === 'CARD') return t?.('sales.paymentCard', { defaultValue: 'Карта' }) || 'Карта';
  if (m === 'MIXED') return t?.('salesLedger.filters.mixed', { defaultValue: 'Смешанная' }) || 'Смешанная';
  return t?.('sales.paymentCash', { defaultValue: 'Наличные' }) || 'Наличные';
}

/**
 * @param {'bill'|'sale'} kind
 */
export function buildRestaurantTicketBody({
  kind = 'bill',
  order,
  sale,
  t,
  shift = null,
  waiterName = null,
  paymentMethod = null,
  qrValue = '',
} = {}) {
  const isSale = kind === 'sale' && sale;
  const items = isSale
    ? (sale.items || []).filter((row) => !row.isServiceLine)
    : (order?.items || []).filter((item) => String(item.itemStatus || '').toUpperCase() !== 'CANCELLED');

  const service = isSale
    ? { percent: Number(sale.servicePercent) || 0, amount: Number(sale.serviceAmount) || 0 }
    : resolveServicePreview(order);
  const subtotal = isSale
    ? round2(Number(sale.subtotal) || 0)
    : round2(Number(order?.subtotal) || items.reduce((s, i) => s + (Number(i.lineTotal) || 0), 0));
  const discount = isSale
    ? round2(Number(sale.discountTotal ?? sale.orderDiscountAmount) || 0)
    : round2(Math.max(0, Number(order?.discountAmount) || 0));
  const withoutService = round2(Math.max(0, subtotal - discount));
  const grand = isSale
    ? round2(Number(sale.totalAmount) || 0)
    : resolveRestaurantPayTotal(order, service);
  const vat = isSale
    ? round2(Number(sale.taxTotal) || vatTotalFromItems(items))
    : vatTotalFromItems(items);

  const lines = [];

  if (isSale) {
    if (sale.storeName) lines.push(String(sale.storeName));
    lines.push(`№${sale.receiptNumber || sale.id || '—'} · ${ticketStamp(sale.createdAt)}`);
    if (sale.customerName) lines.push(String(sale.customerName));
    if (sale.cashierName || sale.employeeName) {
      const label = t?.('fiscalReceipt.cashier', { defaultValue: 'Кассир' }) || 'Кассир';
      lines.push(`${label}: ${sale.cashierName || sale.employeeName}`);
    }
  } else {
    const place = order?.tableCode
      ? (t?.('rst.order.tableHeading', { code: order.tableCode, defaultValue: `Стол ${order.tableCode}` })
        || `Стол ${order.tableCode}`)
      : (order?.clientName || '');
    if (place || order?.orderNo != null) {
      lines.push(`${place}${order?.orderNo != null ? ` · №${order.orderNo}` : ''}`.trim());
    }
  }

  if (shift?.openedAt) {
    const shiftLabel = t?.('rst.order.shiftLine', { defaultValue: 'Смена' }) || 'Смена';
    lines.push(`${shiftLabel} · ${ticketStamp(shift.openedAt)}`);
  } else if (!isSale) {
    lines.push(ticketStamp());
  }

  if (waiterName) {
    const waiterLabel = t?.('rst.order.waiter', { defaultValue: 'Официант' }) || 'Официант';
    lines.push(`${waiterLabel}: ${waiterName}`);
  }

  lines.push('---');
  for (const item of items) {
    lines.push(...formatTicketItemLines(item));
  }
  lines.push('---');

  lines.push(moneyRow(
    t?.('rst.order.subtotalShort', { defaultValue: 'Подытог' }) || 'Подытог',
    subtotal,
  ));
  if (service.amount > 0) {
    const svcLabel = service.percent > 0
      ? (t?.('rst.order.serviceLine', { percent: service.percent, defaultValue: `Обслуживание ${service.percent}%` })
        || `Обслуживание ${service.percent}%`)
      : (t?.('rst.order.serviceShort', { defaultValue: 'Обслуживание' }) || 'Обслуживание');
    lines.push(moneyRow(svcLabel, service.amount));
  }
  if (discount > 0) {
    lines.push(moneyRow(t?.('rst.order.discount', { defaultValue: 'Скидка' }) || 'Скидка', -discount));
  }

  if (isSale || paymentMethod) {
    const method = paymentMethodLabel(paymentMethod || sale?.paymentMethod, t);
    const formLabel = t?.('rst.order.paymentFormLine', {
      method,
      defaultValue: `Форма оплаты: ${method}`,
    }) || `Форма оплаты: ${method}`;
    lines.push(formLabel);
  }

  if (vat > 0) {
    lines.push(moneyRow(t?.('rst.order.vatShort', { defaultValue: 'НДС' }) || 'НДС', vat));
  }

  if (service.amount > 0) {
    lines.push(moneyRow(
      t?.('rst.order.withoutService', { defaultValue: 'Без обслуживания' }) || 'Без обслуживания',
      withoutService,
    ));
  }

  lines.push('---');
  const totalLabel = t?.('rst.order.totalDue', { defaultValue: 'ИТОГО' }) || 'ИТОГО';
  lines.push(padRow(totalLabel.toUpperCase(), fmtMoneyCompact(grand)));

  if (isSale && Number(sale.changeGiven) > 0) {
    lines.push(moneyRow(
      t?.('fiscalReceipt.change', { defaultValue: 'Сдача' }) || 'Сдача',
      sale.changeGiven,
    ));
  }

  const qr = String(qrValue || '').trim();
  if (qr) {
    lines.push('---');
    lines.push(t?.('rst.order.ofdQrHint', { defaultValue: 'ОФД / QR' }) || 'ОФД / QR');
    lines.push(qr.length > TICKET_WIDTH ? qr.slice(0, TICKET_WIDTH) : qr);
  }

  lines.push('---');
  lines.push(t?.('rst.order.billFooter', { defaultValue: 'Спасибо за визит!' }) || 'Спасибо за визит!');
  return lines;
}

/**
 * Shared guest bill / ordinary receipt text lines for thermal printers.
 * Items: name left, "qty×price = total" right (one row). VAT only in footer.
 */
import { fmtMoneyCompact } from '../../../utils/formatMoney';
import { extractVatFromInclusive, round2 } from '../../../utils/taxAmounts';
import { footerLines } from '../../shared/printProfile/applyPrintProfile';
import { fieldStyle } from '../../shared/printProfile/printProfileDefaults';
import { resolveRestaurantPayTotal, resolveServicePreview } from './restaurantPayAmount';
import {
  emphPadRow,
  moneyRow,
  padRow,
  RECEIPT_WIDTH,
  TICKET_WIDTH,
  ticketStamp,
} from './ticketLayout';

function fmtQty(qty) {
  const n = Number(qty) || 0;
  if (Number.isInteger(n) || Math.abs(n - Math.round(n)) < 0.0005) return String(Math.round(n));
  return String(Math.round(n * 1000) / 1000);
}

/** One item → one padded row (mods folded into name); note on extra line. */
export function formatTicketItemLines(item, width = RECEIPT_WIDTH) {
  const base = String(item?.name || item?.productName || '').trim() || '—';
  const mods = (item?.modifiers || [])
    .map((m) => (typeof m === 'string' ? m : (m.name || m.optionName || '')))
    .map((name) => String(name || '').trim())
    .filter(Boolean);
  const name = mods.length ? `${base} ${mods.join(' ')}` : base;
  const qty = fmtQty(item?.quantity);
  const unit = fmtMoneyCompact(item?.unitPrice ?? item?.price ?? 0);
  const total = fmtMoneyCompact(item?.lineTotal ?? item?.total ?? 0);
  const money = `${qty}×${unit} = ${total}`;
  const out = [padRow(name, money, width)];
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
  if (m === 'CASHLESS') return t?.('sales.paymentCashless', { defaultValue: 'Безналичная' }) || 'Безналичная';
  if (m === 'MIXED') return t?.('salesLedger.filters.mixed', { defaultValue: 'Смешанная' }) || 'Смешанная';
  return t?.('sales.paymentCash', { defaultValue: 'Наличные' }) || 'Наличные';
}

function resolvePlaceLine(order, t, header) {
  if (header) return String(header).trim();
  if (!order?.tableCode) return order?.clientName || '';
  const hall = order?.hallName ? String(order.hallName).trim() : '';
  if (hall) {
    return t?.('rst.order.ticketTitle', {
      code: order.tableCode,
      hall,
      defaultValue: `${hall} · Стол ${order.tableCode}`,
    }) || `${hall} · Стол ${order.tableCode}`;
  }
  return t?.('rst.order.tableHeading', {
    code: order.tableCode,
    defaultValue: `Стол ${order.tableCode}`,
  }) || `Стол ${order.tableCode}`;
}

/**
 * @param {'bill'|'sale'} kind
 * @param {string|null} [header] prebuilt place line (e.g. "Зал · Стол 2" from print job)
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
  header = null,
  profile = null,
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
  const grand = isSale
    ? round2(Number(sale.totalAmount) || 0)
    : resolveRestaurantPayTotal(order, service);
  const vat = isSale
    ? round2(Number(sale.taxTotal) || vatTotalFromItems(items))
    : vatTotalFromItems(items);

  const slipType = 'GUEST_BILL';
  const show = (key) => !profile || fieldStyle(profile, slipType, key).on;
  const lines = [];

  if (isSale) {
    if (sale.storeName) lines.push(String(sale.storeName));
    lines.push(`№${sale.receiptNumber || sale.id || '—'} · ${ticketStamp(sale.createdAt)}`);
    if (sale.customerName) lines.push(String(sale.customerName));
    if (show('waiter') && (sale.cashierName || sale.employeeName)) {
      const label = t?.('fiscalReceipt.cashier', { defaultValue: 'Кассир' }) || 'Кассир';
      lines.push(`${label}: ${sale.cashierName || sale.employeeName}`);
    }
  } else if (show('hallTable')) {
    const place = resolvePlaceLine(order, t, header);
    if (place || order?.orderNo != null) {
      lines.push(`${place}${order?.orderNo != null ? ` · №${order.orderNo}` : ''}`.trim());
    }
  }

  if (show('time')) {
    if (shift?.openedAt) {
      const shiftLabel = t?.('rst.order.shiftLine', { defaultValue: 'Смена' }) || 'Смена';
      lines.push(`${shiftLabel} · ${ticketStamp(shift.openedAt)}`);
    } else if (!isSale) {
      lines.push(ticketStamp());
    }
  }

  if (show('waiter') && waiterName) {
    const waiterLabel = t?.('rst.order.waiter', { defaultValue: 'Официант' }) || 'Официант';
    lines.push(`${waiterLabel}: ${waiterName}`);
  }

  if (show('items')) {
    lines.push('---');
    for (const item of items) {
      lines.push(...formatTicketItemLines(item));
    }
    lines.push('---');
  }

  if (show('totals')) {
    lines.push(moneyRow(
      t?.('rst.order.subtotalShort', { defaultValue: 'Подытог' }) || 'Подытог',
      subtotal,
      RECEIPT_WIDTH,
    ));
    if (service.amount > 0) {
      const svcLabel = service.percent > 0
        ? (t?.('rst.order.serviceLine', { percent: service.percent, defaultValue: `Обслуживание ${service.percent}%` })
          || `Обслуживание ${service.percent}%`)
        : (t?.('rst.order.serviceShort', { defaultValue: 'Обслуживание' }) || 'Обслуживание');
      lines.push(moneyRow(svcLabel, service.amount, RECEIPT_WIDTH));
    }
    if (discount > 0) {
      lines.push(moneyRow(
        t?.('rst.order.discount', { defaultValue: 'Скидка' }) || 'Скидка',
        -discount,
        RECEIPT_WIDTH,
      ));
    }
  }

  if (isSale || paymentMethod) {
    const method = paymentMethodLabel(paymentMethod || sale?.paymentMethod, t);
    const formLabel = t?.('rst.order.paymentFormLine', {
      method,
      defaultValue: `Форма оплаты: ${method}`,
    }) || `Форма оплаты: ${method}`;
    lines.push(formLabel);
  }

  if (show('totals')) {
    if (vat > 0) {
      lines.push(moneyRow(
        t?.('rst.order.vatShort', { defaultValue: 'НДС' }) || 'НДС',
        vat,
        RECEIPT_WIDTH,
      ));
    }

    lines.push('---');
    const totalLabel = t?.('rst.order.totalDue', { defaultValue: 'ИТОГО' }) || 'ИТОГО';
    lines.push(emphPadRow(totalLabel.toUpperCase(), fmtMoneyCompact(grand), RECEIPT_WIDTH));
  }

  if (isSale && Number(sale.changeGiven) > 0) {
    lines.push(moneyRow(
      t?.('fiscalReceipt.change', { defaultValue: 'Сдача' }) || 'Сдача',
      sale.changeGiven,
      RECEIPT_WIDTH,
    ));
  }

  const qr = String(qrValue || '').trim();
  if (qr) {
    lines.push('---');
    lines.push(t?.('rst.order.ofdQrHint', { defaultValue: 'ОФД / QR' }) || 'ОФД / QR');
    lines.push(qr.length > TICKET_WIDTH ? qr.slice(0, TICKET_WIDTH) : qr);
  }

  lines.push('---');
  if (!footerLines(profile, slipType).length) {
    lines.push(t?.('rst.order.billFooter', { defaultValue: 'Спасибо за визит!' }) || 'Спасибо за визит!');
  }
  return lines;
}

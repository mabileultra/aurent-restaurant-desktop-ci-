/**
 * Shared guest bill / ordinary receipt text lines for thermal printers.
 * Items: name left, "qty×price = total" right (one row). VAT only in footer.
 */
import { fmtMoneyCompact } from '../../../utils/formatMoney';
import { extractVatFromInclusive, round2 } from '../../../utils/taxAmounts';
import { getReceiptTranslator } from '../../../utils/receiptI18n';
import { footerLines } from '../../shared/printProfile/applyPrintProfile';
import { resolveRestaurantPayTotal, resolveServicePreview } from './restaurantPayAmount';
import {
  fieldStyle,
  GUEST_SLIP,
  pushProfileLine,
  styleGuestItemRows,
  styleLine,
  styleTotalsRow,
} from './guestBillProfileStyle';
import {
  emphPadRow,
  moneyRow,
  padRow,
  qtyNameRow,
  RECEIPT_WIDTH,
  TICKET_WIDTH,
  ticketStamp,
} from './ticketLayout';

function fmtQty(qty) {
  const n = Number(qty) || 0;
  if (Number.isInteger(n) || Math.abs(n - Math.round(n)) < 0.0005) return String(Math.round(n));
  return String(Math.round(n * 1000) / 1000);
}

/**
 * One item → one padded row (mods folded into name); note on extra line.
 * @param {object} item
 * @param {number|{ width?: number, withMoney?: boolean }} [opts]
 */
export function formatTicketItemLines(item, opts = RECEIPT_WIDTH) {
  const width = typeof opts === 'number' ? opts : (opts?.width ?? RECEIPT_WIDTH);
  const withMoney = typeof opts === 'number' ? true : opts?.withMoney !== false;
  const base = String(item?.name || item?.productName || '').trim() || '—';
  const mods = (item?.modifiers || [])
    .map((m) => (typeof m === 'string' ? m : (m.name || m.optionName || '')))
    .map((name) => String(name || '').trim())
    .filter(Boolean);
  const name = mods.length ? `${base} ${mods.join(' ')}` : base;
  const qty = fmtQty(item?.quantity);
  const out = withMoney
    ? [padRow(
      name,
      `${qty}×${fmtMoneyCompact(item?.unitPrice ?? item?.price ?? 0)} = ${fmtMoneyCompact(item?.lineTotal ?? item?.total ?? 0)}`,
      width,
    )]
    : [qtyNameRow(item?.quantity, name, width)];
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
  if (m === 'CARD') return t?.('sales.paymentCard', { defaultValue: 'Karta' }) || 'Karta';
  if (m === 'CASHLESS') return t?.('sales.paymentCashless', { defaultValue: 'Naqdsiz' }) || 'Naqdsiz';
  if (m === 'MIXED') return t?.('salesLedger.filters.mixed', { defaultValue: 'Aralash' }) || 'Aralash';
  return t?.('sales.paymentCash', { defaultValue: 'Naqd' }) || 'Naqd';
}

function resolvePlaceLine(order, t, header) {
  if (header) return String(header).trim();
  if (!order?.tableCode) return order?.clientName || '';
  const hall = order?.hallName ? String(order.hallName).trim() : '';
  if (hall) {
    return t?.('rst.order.ticketTitle', {
      code: order.tableCode,
      hall,
      defaultValue: `${hall} · Stol ${order.tableCode}`,
    }) || `${hall} · Stol ${order.tableCode}`;
  }
  return t?.('rst.order.tableHeading', {
    code: order.tableCode,
    defaultValue: `Stol ${order.tableCode}`,
  }) || `Stol ${order.tableCode}`;
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
  const tReceipt = getReceiptTranslator(t);
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

  const show = (key) => !profile || fieldStyle(profile, GUEST_SLIP, key).on;
  const lines = [];

  if (isSale) {
    if (sale.storeName) lines.push(String(sale.storeName));
    lines.push(`№${sale.receiptNumber || sale.id || '—'} · ${ticketStamp(sale.createdAt)}`);
    if (sale.customerName) lines.push(String(sale.customerName));
    if (show('waiter') && (sale.cashierName || sale.employeeName)) {
      const label = tReceipt('fiscalReceipt.cashier', { defaultValue: 'Kassir' }) || 'Kassir';
      pushProfileLine(lines, `${label}: ${sale.cashierName || sale.employeeName}`, profile, 'waiter');
    }
  } else if (show('hallTable')) {
    const place = resolvePlaceLine(order, tReceipt, header);
    if (place || order?.orderNo != null) {
      pushProfileLine(
        lines,
        `${place}${order?.orderNo != null ? ` · №${order.orderNo}` : ''}`.trim(),
        profile,
        'hallTable',
      );
    }
  }

  if (show('time')) {
    if (shift?.openedAt) {
      const shiftLabel = tReceipt('rst.order.shiftLine', { defaultValue: 'Smena' }) || 'Smena';
      pushProfileLine(lines, `${shiftLabel} · ${ticketStamp(shift.openedAt)}`, profile, 'time');
    } else if (!isSale) {
      pushProfileLine(lines, ticketStamp(), profile, 'time');
    }
  }

  if (show('waiter') && waiterName) {
    const waiterLabel = tReceipt('rst.order.waiter', { defaultValue: 'Ofitsiant' }) || 'Ofitsiant';
    pushProfileLine(lines, `${waiterLabel}: ${waiterName}`, profile, 'waiter');
  }

  if (show('items')) {
    lines.push('---');
    const withMoney = show('totals');
    for (const item of items) {
      lines.push(...styleGuestItemRows(formatTicketItemLines(item, { withMoney }), profile));
    }
    lines.push('---');
  }

  if (show('totals')) {
    const money = (label, amount) => styleTotalsRow(
      moneyRow(label, amount, RECEIPT_WIDTH),
      profile,
    );
    const sub = money(
      tReceipt('rst.order.subtotalShort', { defaultValue: 'Jami' }) || 'Jami',
      subtotal,
    );
    if (sub) lines.push(sub);
    if (service.amount > 0) {
      const svcLabel = service.percent > 0
        ? (tReceipt('rst.order.serviceLine', { percent: service.percent, defaultValue: `Xizmat ${service.percent}%` })
          || `Xizmat ${service.percent}%`)
        : (tReceipt('rst.order.serviceShort', { defaultValue: 'Xizmat' }) || 'Xizmat');
      const svc = money(svcLabel, service.amount);
      if (svc) lines.push(svc);
    }
    if (discount > 0) {
      const disc = money(
        tReceipt('rst.order.discount', { defaultValue: 'Chegirma' }) || 'Chegirma',
        -discount,
      );
      if (disc) lines.push(disc);
    }
  }

  if (isSale || paymentMethod) {
    const method = paymentMethodLabel(paymentMethod || sale?.paymentMethod, tReceipt);
    const formLabel = tReceipt('rst.order.paymentFormLine', {
      method,
      defaultValue: `To'lov: ${method}`,
    }) || `To'lov: ${method}`;
    lines.push(formLabel);
  }

  if (show('totals')) {
    if (vat > 0) {
      const vatRow = styleTotalsRow(
        moneyRow(
          tReceipt('rst.order.vatShort', { defaultValue: 'QQS' }) || 'QQS',
          vat,
          RECEIPT_WIDTH,
        ),
        profile,
      );
      if (vatRow) lines.push(vatRow);
    }

    lines.push('---');
    const totalLabel = tReceipt('rst.order.totalDue', { defaultValue: 'JAMI' }) || 'JAMI';
    const totalsStyle = fieldStyle(profile, GUEST_SLIP, 'totals');
    const totalPlain = padRow(totalLabel.toUpperCase(), fmtMoneyCompact(grand), RECEIPT_WIDTH);
    // Keep JAMI standout when style is default; respect bold/lg when set in profile.
    if (totalsStyle.bold || totalsStyle.size === 'lg') {
      lines.push(styleLine(totalPlain, totalsStyle));
    } else {
      lines.push(emphPadRow(totalLabel.toUpperCase(), fmtMoneyCompact(grand), RECEIPT_WIDTH));
    }
  }

  if (isSale && Number(sale.changeGiven) > 0) {
    lines.push(moneyRow(
      tReceipt('fiscalReceipt.change', { defaultValue: 'Qaytim' }) || 'Qaytim',
      sale.changeGiven,
      RECEIPT_WIDTH,
    ));
  }

  const qr = String(qrValue || '').trim();
  if (qr) {
    lines.push('---');
    lines.push(tReceipt('rst.order.ofdQrHint', { defaultValue: 'OFD / QR' }) || 'OFD / QR');
    lines.push(qr.length > TICKET_WIDTH ? qr.slice(0, TICKET_WIDTH) : qr);
  }

  lines.push('---');
  if (!footerLines(profile, GUEST_SLIP).length) {
    lines.push(tReceipt('rst.order.billFooter', { defaultValue: 'Tashrifingiz uchun rahmat!' }) || 'Tashrifingiz uchun rahmat!');
  }
  return lines;
}

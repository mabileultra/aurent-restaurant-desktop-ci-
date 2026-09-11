/**
 * Z-отчёт (закрытый) — ESC/POS.
 */
const { fmtMoney, fmtAt } = require('./escpos-format.cjs');
const { appendRow, appendDivider, appendCenterHeader } = require('./escpos-layout.cjs');
const { sanitizePayloadForPrint, preparePrinterEncoding } = require('./escpos-encoding.cjs');

function isOn(fields, key) {
  return fields?.[key] !== false;
}

function moneyNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function appendMoneyIf(printer, label, amount, cur, opts = {}) {
  const n = moneyNum(amount);
  if (!opts.always && n === 0) return;
  appendRow(printer, label, `${fmtMoney(amount)} ${cur}`, Boolean(opts.bold));
}

/**
 * @param {object} payload
 */
function validateZReportPayload(payload) {
  const z = payload?.z;
  if (!z || typeof z !== 'object') {
    throw new Error('Нет данных Z-отчёта');
  }
  if (z.zNumber == null && !z.closedAt) {
    throw new Error('Неполные данные Z-отчёта');
  }
}

/**
 * @param {import('node-thermal-printer').printer} printer
 * @param {object} payload
 */
function buildZReportOnPrinter(printer, payload) {
  const safe = sanitizePayloadForPrint(payload);
  const { z, labels: L = {}, branding = {}, receiptFields: fields = {} } = safe;
  const cur = L.currency || 'sum';

  printer.clear();
  preparePrinterEncoding(printer);

  const company =
    String(branding.companyName || '').trim() ||
    String(z.companyName || '').trim() ||
    String(z.storeName || '').trim() ||
    'Aurent';
  const address =
    String(branding.companyAddress || '').trim() || String(z.companyAddress || '').trim();
  const phone = String(branding.companyPhone || '').trim();
  const tin = String(branding.stir || '').trim() || String(z.tin || '').trim();

  const headerLines = [company, (L.zReportTitle || 'Z-REPORT').toUpperCase()];
  if (isOn(fields, 'companyAddress') && address) {
    headerLines.push(address);
  }
  if (isOn(fields, 'companyPhone') && phone) {
    headerLines.push(`${L.phoneLabel || 'Tel'}: ${phone}`);
  }
  appendCenterHeader(printer, headerLines);
  appendDivider(printer);

  appendRow(printer, L.terminalSerial || 'Terminal', z.terminalSerial ?? '—');
  appendRow(printer, L.appletVer || 'Applet', z.appletVersion ?? '—');
  appendRow(printer, L.employee || 'Employee', z.employeeName ?? '—');
  appendRow(printer, L.storeName || 'Store', z.storeName ?? '—');
  appendRow(printer, L.fiscalCard || 'FM', z.fiscalCardId ?? '—');
  if (isOn(fields, 'stir') && tin) {
    appendRow(printer, L.stir || 'TIN', tin);
  }
  appendRow(printer, L.zNumber || 'Z #', String(z.zNumber ?? '—'), true);
  appendDivider(printer);

  printer.bold(true);
  printer.println(L.sectionSale || 'Sales');
  printer.bold(false);
  appendMoneyIf(printer, L.saleCash || 'Cash', z.cashTotal, cur, { always: true });
  appendMoneyIf(printer, L.saleCard || 'Card', z.cardTotal, cur);
  appendMoneyIf(printer, L.saleHumo || 'Humo', z.humoTotal, cur);
  appendMoneyIf(printer, L.saleUzcard || 'Uzcard', z.uzcardTotal, cur);
  appendMoneyIf(printer, L.saleCashless || 'Cashless', z.cashlessTotal, cur);
  appendMoneyIf(printer, L.saleVat || 'VAT', z.vatAmount, cur);
  appendRow(printer, L.saleCount || 'Count', String(z.salesCount ?? 0));
  appendMoneyIf(printer, L.lineDiscountsSum || 'Line disc.', z.lineDiscountTotal, cur);
  appendMoneyIf(printer, L.orderDiscountSum || 'Order disc.', z.orderDiscountTotal, cur);
  appendMoneyIf(printer, L.discountsSum || 'Discount', z.discountTotal, cur, { bold: true });
  appendDivider(printer);

  const returnsTotal =
    moneyNum(z.returnsCash) +
    moneyNum(z.returnsCard) +
    moneyNum(z.returnsHumo) +
    moneyNum(z.returnsUzcard) +
    moneyNum(z.returnsCashless);
  const hasReturns = (z.returnsCount ?? 0) > 0 || returnsTotal !== 0 || moneyNum(z.vatReturn) !== 0;

  if (hasReturns) {
    appendMoneyIf(printer, L.returnTotal || L.sectionReturn || 'Returns', returnsTotal, cur, {
      always: true,
      bold: true,
    });
    appendMoneyIf(printer, L.returnCash || 'Cash', z.returnsCash, cur);
    appendMoneyIf(printer, L.returnCard || 'Card', z.returnsCard, cur);
    appendMoneyIf(printer, L.returnHumo || 'Humo', z.returnsHumo, cur);
    appendMoneyIf(printer, L.returnUzcard || 'Uzcard', z.returnsUzcard, cur);
    appendMoneyIf(printer, L.returnCashless || 'Cashless', z.returnsCashless, cur);
    appendMoneyIf(printer, L.returnVat || 'VAT', z.vatReturn, cur);
    appendRow(printer, L.returnCount || 'Count', String(z.returnsCount ?? 0));
    appendDivider(printer);
  }

  appendRow(printer, L.openedAt || 'Opened', fmtAt(z.openedAt));
  appendRow(printer, L.closedAt || 'Closed', fmtAt(z.closedAt));
  appendRow(printer, L.firstReceipt || 'First', z.firstReceiptNumber ?? '—');
  appendRow(printer, L.lastReceipt || 'Last', z.lastReceiptNumber ?? '—');
  appendDivider(printer);

  appendRow(printer, L.grandTotal || 'TOTAL', `${fmtMoney(z.totalAmount)} ${cur}`, true);

  printer.newLine();
  printer.cut();
}

module.exports = {
  validateZReportPayload,
  buildZReportOnPrinter,
};

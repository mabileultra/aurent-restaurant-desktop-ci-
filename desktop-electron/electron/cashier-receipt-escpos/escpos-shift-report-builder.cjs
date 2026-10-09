/**
 * X / Z отчёт смены (касса) — ESC/POS.
 */
const { fmtMoney, fmtAt } = require('./escpos-format.cjs');
const { appendRow, appendDivider, appendCenterHeader, beepAndCut } = require('./escpos-layout.cjs');
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
function validateShiftReportPayload(payload) {
  const report = payload?.report;
  if (!report || typeof report !== 'object') {
    throw new Error('Нет данных отчёта смены');
  }
  if (!report.reportType) {
    throw new Error('Не указан тип отчёта (X/Z)');
  }
}

/**
 * @param {import('node-thermal-printer').printer} printer
 * @param {object} payload
 */
function buildShiftReportOnPrinter(printer, payload) {
  const safe = sanitizePayloadForPrint(payload);
  const { report, labels: L = {}, branding = {}, receiptFields: fields = {} } = safe;
  const cur = L.currency || 'sum';
  const title =
    report.reportType === 'X'
      ? L.xReportTitle || 'X-REPORT'
      : L.zReportTitle || 'Z-REPORT';

  printer.clear();
  preparePrinterEncoding(printer);

  const companyName =
    String(branding.companyName || '').trim() ||
    String(report.storeName || '').trim() ||
    'Aurent';
  const headerLines = [companyName, String(title).toUpperCase()];

  if (isOn(fields, 'companyAddress') && branding.companyAddress) {
    headerLines.push(String(branding.companyAddress));
  }
  if (isOn(fields, 'companyPhone') && branding.companyPhone) {
    const phoneLabel = L.phoneLabel || 'Tel';
    headerLines.push(`${phoneLabel}: ${branding.companyPhone}`);
  }
  if (isOn(fields, 'stir') && branding.stir) {
    const stirLabel = L.stir || 'TIN';
    headerLines.push(`${stirLabel}: ${branding.stir}`);
  }

  // Store name only if it differs from company line
  const storeName = String(report.storeName || '').trim();
  if (storeName && storeName.toLowerCase() !== companyName.toLowerCase()) {
    headerLines.push(storeName);
  }

  appendCenterHeader(printer, headerLines);

  if (report.cashierName) {
    appendRow(printer, L.cashier || 'Cashier', String(report.cashierName));
  }
  appendDivider(printer);

  appendRow(printer, L.openedAt || 'Opened', fmtAt(report.openedAt));
  appendRow(printer, L.reportAt || 'Report at', fmtAt(report.reportAt));
  appendDivider(printer);

  appendRow(printer, L.shiftSales || 'Sales', String(report.saleCount ?? 0));
  appendMoneyIf(printer, L.shiftTotal || 'Total', report.totalAmount, cur, { always: true, bold: true });
  appendMoneyIf(printer, L.shiftCash || 'Cash', report.cashAmount, cur, { always: true });
  appendMoneyIf(printer, L.shiftCard || 'Card', report.cardAmount, cur);
  appendMoneyIf(printer, L.shiftHumo || 'Humo', report.humoAmount, cur);
  appendMoneyIf(printer, L.shiftUzcard || 'Uzcard', report.uzcardAmount, cur);
  appendMoneyIf(printer, L.shiftCashless || 'Cashless', report.cashlessAmount, cur);
  appendMoneyIf(printer, L.shiftVat || 'VAT', report.vatAmount, cur);
  appendMoneyIf(printer, L.lineDiscountsSum || 'Line disc.', report.lineDiscountTotal, cur);
  appendMoneyIf(printer, L.orderDiscountSum || 'Order disc.', report.orderDiscountTotal, cur);
  appendMoneyIf(printer, L.discountsSum || 'Discount', report.discountTotal, cur, { bold: true });

  const returnsTotal =
    moneyNum(report.returnsCash) +
    moneyNum(report.returnsCard) +
    moneyNum(report.returnsHumo) +
    moneyNum(report.returnsUzcard) +
    moneyNum(report.returnsCashless);
  const hasReturns = (report.returnsCount ?? 0) > 0 || returnsTotal !== 0 || moneyNum(report.returnsVat) !== 0;

  if (hasReturns) {
    appendDivider(printer);
    appendMoneyIf(printer, L.returnTotal || L.sectionReturn || 'Returns', returnsTotal, cur, {
      always: true,
      bold: true,
    });
    appendMoneyIf(printer, L.returnCash || 'Cash', report.returnsCash, cur);
    appendMoneyIf(printer, L.returnCard || 'Card', report.returnsCard, cur);
    appendMoneyIf(printer, L.returnHumo || 'Humo', report.returnsHumo, cur);
    appendMoneyIf(printer, L.returnUzcard || 'Uzcard', report.returnsUzcard, cur);
    appendMoneyIf(printer, L.returnCashless || 'Cashless', report.returnsCashless, cur);
    appendMoneyIf(printer, L.returnVat || 'VAT', report.returnsVat, cur);
    appendRow(printer, L.returnCount || 'Count', String(report.returnsCount ?? 0));
  }

  printer.newLine();
  beepAndCut(printer);
}

module.exports = {
  validateShiftReportPayload,
  buildShiftReportOnPrinter,
};

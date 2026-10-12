/**
 * Сборка команд чека на экземпляре ThermalPrinter.
 * Подписи полей приходят с фронта (labels), без i18n в main.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const {
  fmtMoney,
  fmtQty,
  splitDateTime,
  buildFiscalSign,
  lineVatAmount,
  interpolateLabel,
  saleVatRateLabel,
} = require('./escpos-format.cjs');
const { logWarn } = require('./escpos-log.cjs');
const { sanitizePayloadForPrint, preparePrinterEncoding } = require('./escpos-encoding.cjs');
const { beepAndCut } = require('./escpos-layout.cjs');

/** @param {Record<string, boolean>|undefined} fields */
function isOn(fields, key) {
  return fields?.[key] !== false;
}

/**
 * Подпись типа чека: Продажа / Возврат / Аванс / Кредит.
 * @param {object} sale
 * @param {Record<string, string>|undefined} L
 */
function resolveReceiptTypeDisplay(sale, L) {
  const labels = L || {};
  if (sale?.receiptTypeDisplay) {
    return String(sale.receiptTypeDisplay);
  }
  if (sale?.receiptDocumentType === 'RETURN') {
    return labels.receiptTypeReturn || 'Return';
  }
  const rt = String(sale?.receiptType || 'SALE').toUpperCase();
  const byType = {
    SALE: labels.receiptTypeSale,
    RETURN: labels.receiptTypeReturn,
    ADVANCE: labels.receiptTypeAdvance,
    CREDIT: labels.receiptTypeCredit,
  };
  return byType[rt] || labels.receiptTypeSale || 'Sale';
}

/**
 * Строка «метка | значение» в две колонки.
 * @param {import('node-thermal-printer').printer} printer
 * @param {string} label
 * @param {string} value
 * @param {boolean} [bold]
 */
function appendRow(printer, label, value, bold = false) {
  const left = String(label ?? '');
  const right = String(value ?? '');
  const width = typeof printer.getWidth === 'function' ? Number(printer.getWidth()) || 32 : 32;
  if (bold) printer.bold(true);
  if (left.length + 1 + right.length <= width) {
    printer.leftRight(left, right);
  } else {
    printer.alignLeft();
    printer.println(left);
    printer.alignRight();
    wrapPlain(right, width).forEach((line) => printer.println(line));
    printer.alignLeft();
  }
  if (bold) printer.bold(false);
}

function wrapPlain(text, width) {
  const src = String(text || '').replace(/\s+/g, ' ').trim();
  const limit = Math.max(8, width);
  if (!src) return [''];
  if (src.length <= limit) return [src];
  const out = [];
  let rest = src;
  while (rest.length > limit) {
    let cut = rest.lastIndexOf(' ', limit);
    if (cut < 8) cut = limit;
    out.push(rest.slice(0, cut).trimEnd());
    rest = rest.slice(cut).trimStart();
  }
  if (rest) out.push(rest);
  return out;
}

/**
 * Разделитель пунктирной линией.
 * @param {import('node-thermal-printer').printer} printer
 */
function appendDivider(printer) {
  printer.drawLine();
}

/**
 * Шапка: логотип, название, адрес, телефон, СТИР.
 * @param {import('node-thermal-printer').printer} printer
 * @param {object} payload
 * @param {string} jobId
 */
async function appendHeader(printer, payload, jobId) {
  const { sale, branding, receiptFields, labels } = payload;
  const fields = receiptFields || {};
  const L = labels || {};

  const phone = String(branding?.companyPhone || '').trim();
  const stir = String(branding?.stir || '').trim();
  const showHeader =
    isOn(fields, 'logo') ||
    isOn(fields, 'companyName') ||
    (isOn(fields, 'companyAddress') && branding?.companyAddress) ||
    (isOn(fields, 'companyPhone') && phone) ||
    (isOn(fields, 'stir') && stir) ||
    phone ||
    stir;

  if (!showHeader) return;

  printer.alignCenter();

  if (isOn(fields, 'logo') && branding?.logoDataUrl) {
    try {
      const imgPath = await writeLogoTempFile(branding.logoDataUrl, jobId);
      if (imgPath) {
        await printer.printImage(imgPath);
        printer.newLine();
        try {
          fs.unlinkSync(imgPath);
        } catch {
          /* ignore */
        }
      }
    } catch (err) {
      logWarn(jobId, 'LOGO_SKIP', { message: err?.message });
    }
  }

  const companyName = branding?.companyName || sale?.storeName || '';
  if (isOn(fields, 'companyName') && companyName) {
    printer.bold(true);
    if (typeof printer.setTextDoubleHeight === 'function') printer.setTextDoubleHeight();
    printer.println(String(companyName).toUpperCase());
    if (typeof printer.setTextNormal === 'function') printer.setTextNormal();
    printer.bold(false);
  }
  if (isOn(fields, 'companyAddress') && branding?.companyAddress) {
    printer.println(String(branding.companyAddress));
  }
  if (phone && isOn(fields, 'companyPhone')) {
    printer.println(`${L.phoneLabel || 'Tel'}: ${phone}`);
  }
  if (stir && isOn(fields, 'stir')) {
    printer.println(`${L.stir || 'STIR'}: ${stir}`);
  }
  printer.alignLeft();
  appendDivider(printer);
}

/**
 * Сохраняет data URL логотипа во временный PNG.
 * @param {string} dataUrl
 * @param {string} jobId
 * @returns {Promise<string|null>}
 */
async function writeLogoTempFile(dataUrl, jobId) {
  const raw = String(dataUrl || '');
  const m = raw.match(/^data:image\/\w+;base64,(.+)$/);
  if (!m) return null;
  const buf = Buffer.from(m[1], 'base64');
  const filePath = path.join(os.tmpdir(), `aurent-receipt-logo-${jobId}.png`);
  fs.writeFileSync(filePath, buf);
  return filePath;
}

/**
 * Мета: дата, время, номер чека, кассир, смена.
 * @param {import('node-thermal-printer').printer} printer
 * @param {object} payload
 */
function appendMeta(printer, payload) {
  const { sale, receiptFields, labels } = payload;
  const fields = receiptFields || {};
  const L = labels || {};
  const hasReceiptNo = Boolean(sale.receiptNumber);
  const showMeta =
    hasReceiptNo ||
    isOn(fields, 'dateTime') ||
    isOn(fields, 'receiptNo') ||
    isOn(fields, 'employee') ||
    isOn(fields, 'shift');

  if (!showMeta) return;

  const { date, time } = splitDateTime(sale.createdAt);
  if (isOn(fields, 'dateTime')) {
    printer.leftRight(`${L.time || 'Time'}: ${time}`, `${L.date || 'Date'}: ${date}`);
  }
  if (hasReceiptNo) {
    appendRow(printer, L.receiptNoShort || 'Receipt', String(sale.receiptNumber));
  }
  if (sale.originalReceiptNumber) {
    appendRow(
      printer,
      L.originalReceiptNo || 'Original receipt',
      String(sale.originalReceiptNumber),
    );
  }
  if (isOn(fields, 'employee') && sale.cashierName) {
    appendRow(printer, L.employee || 'Cashier', sale.cashierName);
  }
  if (isOn(fields, 'shift')) {
    const shiftNo = brandingShift(payload) || '—';
    // Не подставлять хвост номера чека (…-0001) — это не номер смены.
    if (shiftNo && shiftNo !== '—' && shiftNo !== '001') {
      appendRow(printer, L.shift || 'Shift', shiftNo);
    } else if (sale.shiftOpenedAt) {
      const d = new Date(sale.shiftOpenedAt);
      if (!Number.isNaN(d.getTime())) {
        const pad = (n) => String(n).padStart(2, '0');
        const label = `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
        appendRow(printer, L.shift || 'Shift', label);
      }
    } else {
      appendRow(printer, L.shift || 'Shift', '—');
    }
  }
}

/**
 * Тип чека — после оплаты, как на бланке ГНК.
 * @param {import('node-thermal-printer').printer} printer
 * @param {object} payload
 */
function appendReceiptType(printer, payload) {
  const { sale, receiptFields, labels } = payload;
  const fields = receiptFields || {};
  const L = labels || {};
  if (!isOn(fields, 'receiptType')) return;

  const typeValue = resolveReceiptTypeDisplay(sale, L);
  if (!typeValue) return;

  printer.bold(true);
  appendRow(printer, L.receiptType || 'Type', typeValue);
  printer.bold(false);
}

/** @param {object} payload */
function brandingShift(payload) {
  return payload.branding?.shiftNo || payload.labels?.shiftNo || '';
}

function itemUnitPrice(item) {
  const direct = Number(item?.unitPrice ?? item?.price ?? item?.sellingPrice);
  if (Number.isFinite(direct) && direct > 0) return direct;
  const qty = Number(item?.quantity) || 0;
  const total = Number(item?.lineTotal) || 0;
  return qty > 0 ? total / qty : total;
}

/**
 * Позиции как на чеке ГНК: название, qty * цена = сумма.
 * @param {import('node-thermal-printer').printer} printer
 * @param {object} payload
 */
function appendItems(printer, payload) {
  const { sale, receiptFields, labels } = payload;
  const fields = receiptFields || {};
  const L = labels || {};

  if (!isOn(fields, 'items')) return;

  for (const item of sale.items || []) {
    printer.println(String(item.productName || ''));
    const qty = fmtQty(item.quantity, item.saleType);
    printer.println(`${qty} * ${fmtMoney(itemUnitPrice(item))} = ${fmtMoney(item.lineTotal)}`);
    if (isOn(fields, 'itemVatLine')) {
      const rate = item.taxRatePercent != null ? Number(item.taxRatePercent) : 12;
      const rateStr = Number.isFinite(rate) ? String(Math.round(rate)) : '12';
      const vat = lineVatAmount(item);
      const vatLabel = interpolateLabel(L.vatLineShort || 'VAT {{rate}}%', { rate: rateStr });
      appendRow(printer, vatLabel, fmtMoney(vat));
    }
    if (isOn(fields, 'itemIkpu') && item.ikpu) {
      printer.println(`${L.ikpuLine || 'MXIK'}: ${item.ikpu}`);
    }
  }
  appendDivider(printer);
}

/**
 * Скидки, итог, НДС.
 * @param {import('node-thermal-printer').printer} printer
 * @param {object} payload
 */
function appendTotals(printer, payload) {
  const { sale, receiptFields, labels } = payload;
  const fields = receiptFields || {};
  const L = labels || {};

  const show =
    isOn(fields, 'discounts') || isOn(fields, 'grandTotal') || isOn(fields, 'vatTotal');
  if (!show) return;

  if (isOn(fields, 'discounts') && Number(sale.lineDiscountTotal) > 0) {
    appendRow(printer, L.lineDiscountsSum || 'Line disc.', fmtMoney(sale.lineDiscountTotal));
  }
  if (isOn(fields, 'discounts') && Number(sale.orderDiscountAmount) > 0) {
    appendRow(printer, L.orderDiscountSum || 'Order disc.', fmtMoney(sale.orderDiscountAmount));
  }
  if (isOn(fields, 'discounts') && Number(sale.discountTotal) > 0) {
    appendRow(printer, L.discountsSum || 'Discount', fmtMoney(sale.discountTotal), true);
  }
  if (isOn(fields, 'grandTotal')) {
    appendRow(printer, L.grandTotal || 'TOTAL', fmtMoney(sale.totalAmount), true);
  }
  if (isOn(fields, 'vatTotal')) {
    const vatLabel = interpolateLabel(L.vatTotalLine || 'VAT {{rate}}%', {
      rate: saleVatRateLabel(sale),
    });
    appendRow(printer, vatLabel, fmtMoney(sale.taxTotal));
  }
  appendDivider(printer);
}

/**
 * Оплата: наличные, карта, сдача.
 * @param {import('node-thermal-printer').printer} printer
 * @param {object} payload
 */
function appendPayment(printer, payload) {
  const { sale, receiptFields, labels } = payload;
  const fields = receiptFields || {};
  const L = labels || {};

  if (!isOn(fields, 'payment')) return;

  const method = sale.paymentMethod;
  const total = Number(sale.totalAmount) || 0;
  const cashExplicit = Number(sale.cashAmount);
  const cardExplicit = Number(sale.cardAmount);
  const tendered = Number(sale.amountTendered);
  const hasCash = Number.isFinite(cashExplicit) && cashExplicit > 0;
  const hasCard = Number.isFinite(cardExplicit) && cardExplicit > 0;
  // CASH: cashAmount в API = выручка (total), amountTendered = сколько дали.
  // На чеке в «Наличные» — полученное, иначе сдача выглядит сломанной.
  let cashAmt = 0;
  let cardAmt = 0;
  if (method === 'CASH' && !hasCard) {
    cashAmt = Number.isFinite(tendered) && tendered > 0
      ? tendered
      : hasCash
        ? cashExplicit
        : total;
  } else if (hasCash || hasCard) {
    cashAmt = hasCash ? cashExplicit : 0;
    cardAmt = hasCard ? cardExplicit : 0;
  } else if (method === 'CARD' || method === 'CASHLESS' || method === 'MPESA') {
    cardAmt = Number.isFinite(tendered) && tendered > 0 ? tendered : total;
  }
  const change = Number(sale.changeGiven) || 0;

  appendRow(printer, L.paymentForm || 'Payment', fmtMoney(total));
  appendRow(printer, L.cash || 'Cash', fmtMoney(cashAmt));
  appendRow(printer, L.plastic || 'Card', fmtMoney(cardAmt));
  if (change > 0) {
    appendRow(printer, L.change || 'Change', fmtMoney(change), true);
  }
  appendDivider(printer);
}

/**
 * Фискальный блок.
 * @param {import('node-thermal-printer').printer} printer
 * @param {object} payload
 */
function appendFiscalBlock(printer, payload) {
  const { sale, receiptFields, labels, branding } = payload;
  const fields = receiptFields || {};
  const L = labels || {};

  if (!isOn(fields, 'fiscalBlock')) return;

  printer.bold(true);
  printer.println(L.fiscalSection || 'Fiscal');
  printer.bold(false);

  const qrParts = String(sale?.fiscalQrUrl || payload?.qrValue || '');
  const fmFromQr = (qrParts.match(/[?&]t=([^&]+)/i) || [])[1];
  const seqFromQr = (qrParts.match(/[?&]r=([^&]+)/i) || [])[1];
  const virtualRegister = String(branding?.virtualRegister || '').trim();
  const fmNumber = String(sale.fiscalTerminalId || branding?.fmNumber || fmFromQr || '').trim();
  const fiscalReceiptNo = String(sale.fiscalReceiptSeq || seqFromQr || '').trim();
  const fiscalSign = buildFiscalSign(sale);

  if (fiscalReceiptNo) {
    appendRow(printer, L.fiscalReceiptNo || 'Fiscal #', fiscalReceiptNo);
  }
  if (fmNumber) {
    appendRow(printer, L.fmNumber || 'FM', fmNumber);
  }
  if (virtualRegister && virtualRegister !== '1') {
    appendRow(printer, L.virtualRegister || 'Reg.', virtualRegister);
  }
  if (fiscalSign) {
    appendRow(printer, L.fiscalSign || 'Sign', fiscalSign);
  }
  appendDivider(printer);
}

/**
 * Крупный налоговый QR. Подвал «спасибо / призовые игры ГНК» не печатаем.
 * @param {import('node-thermal-printer').printer} printer
 * @param {object} payload
 * @param {string} jobId
 */
async function appendQrAndFooter(printer, payload, jobId) {
  const { sale, receiptFields, qrValue: payloadQr } = payload;
  const fields = receiptFields || {};

  if (!isOn(fields, 'qrCode') || sale?.printFiscalQr === false) return;

  const qrValue = String(payloadQr || sale?.fiscalQrUrl || '').trim();
  const isTaxQr =
    /ofd\.soliq\.uz\/(check|epi)\?/i.test(qrValue) && /[?&]t=/i.test(qrValue) && /[?&]s=/i.test(qrValue);
  if (!isTaxQr) return;

  printer.alignCenter();
  printer.newLine();

  let printedImage = false;
  const dataUrl = String(payload.qrImageDataUrl || '').trim();
  if (dataUrl) {
    try {
      const imgPath = await writeLogoTempFile(dataUrl, `${jobId}-qr`);
      if (imgPath) {
        await printer.printImage(imgPath);
        printedImage = true;
        try {
          fs.unlinkSync(imgPath);
        } catch {
          /* ignore */
        }
      }
    } catch (err) {
      logWarn(jobId, 'QR_IMAGE_SKIP', { message: err?.message });
    }
  }
  if (!printedImage) {
    try {
      const mm = Number(payload.paperWmm) || 80;
      printer.printQR(qrValue, { cellSize: mm <= 58 ? 5 : 7, correction: 'M', model: 2 });
    } catch (err) {
      logWarn(jobId, 'QR_SKIP', { message: err?.message, len: qrValue.length });
    }
  }
  printer.newLine();
  printer.alignLeft();
}

/** Restaurant print-profile footer. Empty label stays off — fiscal slips unchanged. */
function appendProfileFooter(printer, payload) {
  const text = String(payload?.labels?.footer || '').trim();
  if (!text || !isOn(payload?.receiptFields, 'footer')) return;
  printer.alignCenter();
  printer.newLine();
  printer.println(text);
  printer.alignLeft();
}

/**
 * Заполняет printer всеми секциями чека.
 * @param {import('node-thermal-printer').printer} printer
 * @param {object} payload
 * @param {string} jobId
 */
async function buildReceiptOnPrinter(printer, payload, jobId) {
  const safePayload = sanitizePayloadForPrint(payload);
  printer.clear();
  preparePrinterEncoding(printer, safePayload.locale);
  await appendHeader(printer, safePayload, jobId);
  appendMeta(printer, safePayload);
  if (isOn(safePayload.receiptFields, 'items')) {
    appendDivider(printer);
  }
  appendItems(printer, safePayload);
  appendTotals(printer, safePayload);
  appendPayment(printer, safePayload);
  appendReceiptType(printer, safePayload);
  appendFiscalBlock(printer, safePayload);
  await appendQrAndFooter(printer, safePayload, jobId);
  appendProfileFooter(printer, safePayload);
  printer.newLine();
  printer.newLine();
  beepAndCut(printer);
}

/**
 * Проверяет минимальный payload.
 * @param {object} payload
 */
function validatePayload(payload) {
  const sale = payload?.sale;
  if (!sale || typeof sale !== 'object') {
    throw new Error('Нет данных продажи (sale)');
  }
  const textLen = JSON.stringify(sale).length;
  if (!sale.receiptNumber || textLen < 40) {
    throw new Error('Неполные данные чека');
  }
}

module.exports = {
  appendHeader,
  appendMeta,
  appendReceiptType,
  appendItems,
  appendTotals,
  appendPayment,
  appendFiscalBlock,
  appendQrAndFooter,
  buildReceiptOnPrinter,
  validatePayload,
};

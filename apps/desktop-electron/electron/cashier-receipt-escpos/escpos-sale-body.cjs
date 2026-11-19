/**
 * Body sections of fiscal sale ESC/POS (meta → footer text).
 */
const {
  fmtMoney,
  fmtQty,
  splitDateTime,
  formatCardNumberForReceipt,
  resolveItemBarcode,
  resolveItemMarkingLabel,
  buildFiscalSign,
  doesVersionRowFitSingleLine,
  resolveItemCommittent,
  lineVatAmount,
  interpolateLabel,
  saleVatRateLabel,
} = require('./escpos-format.cjs');
const { withFieldStyle } = require('./escpos-field-style.cjs');
const {
  isOn,
  appendRow,
  appendDivider,
  resolveReceiptTypeDisplay,
  brandingShift,
  itemUnitPrice,
} = require('./escpos-sale-layout.cjs');

function appendMeta(printer, payload) {
  const { sale, receiptFields, labels, receiptFieldStyles: styles } = payload;
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
    withFieldStyle(printer, styles, 'dateTime', () => {
      printer.leftRight(`${L.date || 'Sana'}: ${date}`, `${L.time || 'Vaqt'}: ${time}`);
    });
  }
  const seq = String(sale.fiscalReceiptSeq || sale.receiptNumber || '').replace(/^№\s*/, '');
  if (seq && isOn(fields, 'receiptNo')) {
    withFieldStyle(printer, styles, 'receiptNo', () => {
      appendRow(printer, L.receiptNoShort || 'Chek raqami', `№${seq}`);
    });
  } else if (seq) {
    appendRow(printer, L.receiptNoShort || 'Chek raqami', `№${seq}`);
  }
  if (sale.originalReceiptNumber) {
    appendRow(
      printer,
      L.originalReceiptNo || 'Original receipt',
      String(sale.originalReceiptNumber),
    );
  }
  if (isOn(fields, 'employee') && sale.cashierName) {
    withFieldStyle(printer, styles, 'employee', () => {
      appendRow(printer, L.employee || 'Cashier', sale.cashierName);
    });
  }
  if (isOn(fields, 'shift')) {
    withFieldStyle(printer, styles, 'shift', () => {
      const shiftNo = brandingShift(payload) || '—';
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
    });
  }
}

function appendReceiptType(printer, payload) {
  const { sale, receiptFields, labels, receiptFieldStyles: styles } = payload;
  const fields = receiptFields || {};
  const L = labels || {};
  if (!isOn(fields, 'receiptType')) return;

  const typeValue = resolveReceiptTypeDisplay(sale, L);
  if (!typeValue) return;

  withFieldStyle(printer, styles, 'receiptType', () => {
    appendRow(printer, L.receiptType || 'Type', typeValue, true);
  });
}

function appendItems(printer, payload) {
  const { sale, receiptFields, labels, receiptFieldStyles: styles } = payload;
  const fields = receiptFields || {};
  const L = labels || {};

  if (!isOn(fields, 'items')) return;

  for (const item of sale.items || []) {
    withFieldStyle(printer, styles, 'items', () => {
      printer.println(String(item.productName || ''));
    });
    const qty = fmtQty(item.quantity, item.saleType, item.unitOfMeasure);
    printer.println(`${qty} * ${fmtMoney(itemUnitPrice(item))} = ${fmtMoney(item.lineTotal)}`);
    if (isOn(fields, 'itemVatLine')) {
      const rate = item.taxRatePercent != null ? Number(item.taxRatePercent) : 12;
      const rateStr = Number.isFinite(rate) ? String(Math.round(rate)) : '12';
      const vat = lineVatAmount(item);
      const vatLabel = interpolateLabel(L.vatLineShort || 'VAT {{rate}}%', { rate: rateStr });
      withFieldStyle(printer, styles, 'itemVatLine', () => {
        appendRow(printer, vatLabel, fmtMoney(vat));
      });
    }
    if (isOn(fields, 'itemIkpu') && item.ikpu) {
      withFieldStyle(printer, styles, 'itemIkpu', () => {
        printer.println(`${L.ikpuLine || 'MXIK'}: ${item.ikpu}`);
      });
    }
    const barcode = resolveItemBarcode(item);
    if (barcode) {
      const barcodeLabel = L.barcode || 'ShT.kod';
      const fullBarcode = `${barcodeLabel}: ${barcode}`;
      const lineWidth =
        Number(payload?.paperWmm) && Number(payload.paperWmm) <= 58
          ? 32
          : (typeof printer?.getWidth === 'function' && Number(printer.getWidth())) || 42;
      withFieldStyle(printer, styles, 'itemBarcode', () => {
        if (fullBarcode.length <= lineWidth) {
          printer.println(fullBarcode);
        } else {
          printer.println(`${barcodeLabel}:`);
          printer.println(barcode);
        }
      });
    }
    const mk = resolveItemMarkingLabel(item);
    if (mk) {
      const markingLabel = L.marking || 'MK';
      const fullMarking = `${markingLabel}: ${mk}`;
      const lineWidth =
        Number(payload?.paperWmm) && Number(payload.paperWmm) <= 58
          ? 32
          : (typeof printer?.getWidth === 'function' && Number(printer.getWidth())) || 42;
      withFieldStyle(printer, styles, 'itemMarking', () => {
        if (fullMarking.length <= lineWidth) {
          printer.println(fullMarking);
        } else {
          printer.println(`${markingLabel}:`);
          for (let i = 0; i < mk.length; i += lineWidth) {
            printer.println(mk.slice(i, i + lineWidth));
          }
        }
      });
    }
    const committent = resolveItemCommittent(item);
    if (committent) {
      const label =
        committent.kind === 'PINFL'
          ? (L.committentPinfl || 'Komitent (JShShIR)')
          : (L.committentTin || 'Komitent (STIR)');
      const fullText = `${label}: ${committent.value}`;
      const lineWidth =
        Number(payload?.paperWmm) && Number(payload.paperWmm) <= 58
          ? 32
          : (typeof printer?.getWidth === 'function' && Number(printer.getWidth())) || 42;
      withFieldStyle(printer, styles, 'itemCommittent', () => {
        if (fullText.length <= lineWidth) {
          printer.println(fullText);
        } else {
          printer.println(`${label}:`);
          printer.println(committent.value);
        }
      });
    }
  }
  appendDivider(printer);
}

function appendTotals(printer, payload) {
  const { sale, receiptFields, labels, receiptFieldStyles: styles } = payload;
  const fields = receiptFields || {};
  const L = labels || {};

  const show =
    isOn(fields, 'service') ||
    isOn(fields, 'discounts') ||
    isOn(fields, 'grandTotal') ||
    isOn(fields, 'vatTotal');
  if (!show) return;

  const serviceAmt = Number(sale.serviceAmount ?? sale.commissionAmount) || 0;
  if (isOn(fields, 'service') && serviceAmt > 0) {
    const pct = Number(sale.servicePercent) || 0;
    const svcLabel = pct > 0
      ? interpolateLabel(L.serviceLine || 'Service {{percent}}%', { percent: String(pct) })
      : (L.serviceShort || 'Service');
    withFieldStyle(printer, styles, 'service', () => {
      appendRow(printer, svcLabel, fmtMoney(serviceAmt));
    });
  }

  if (isOn(fields, 'discounts') && Number(sale.lineDiscountTotal) > 0) {
    withFieldStyle(printer, styles, 'discounts', () => {
      appendRow(printer, L.lineDiscountsSum || 'Line disc.', fmtMoney(sale.lineDiscountTotal));
    });
  }
  if (isOn(fields, 'discounts') && Number(sale.orderDiscountAmount) > 0) {
    withFieldStyle(printer, styles, 'discounts', () => {
      appendRow(printer, L.orderDiscountSum || 'Order disc.', fmtMoney(sale.orderDiscountAmount));
    });
  }
  if (isOn(fields, 'discounts') && Number(sale.discountTotal) > 0) {
    withFieldStyle(printer, styles, 'discounts', () => {
      appendRow(printer, L.discountsSum || 'Discount', fmtMoney(sale.discountTotal), true);
    });
  }
  if (isOn(fields, 'grandTotal')) {
    withFieldStyle(printer, styles, 'grandTotal', () => {
      appendRow(printer, L.grandTotal || 'TOTAL', fmtMoney(sale.totalAmount), true);
    });
  }
  if (isOn(fields, 'vatTotal')) {
    const vatLabel = interpolateLabel(L.vatTotalLine || 'VAT {{rate}}%', {
      rate: saleVatRateLabel(sale),
    });
    withFieldStyle(printer, styles, 'vatTotal', () => {
      appendRow(printer, vatLabel, fmtMoney(sale.taxTotal));
    });
  }
  appendDivider(printer);
}

function appendPayment(printer, payload) {
  const { sale, receiptFields, labels, receiptFieldStyles: styles } = payload;
  const fields = receiptFields || {};
  const L = labels || {};

  if (!isOn(fields, 'payment')) return;

  const method = sale.paymentMethod;
  const total = Number(sale.totalAmount) || 0;
  const cashExplicit = Number(sale.cashAmount);
  const cardExplicit = Number(sale.cardAmount);
  const qrExplicit = Number(sale.qrAmount ?? sale.cashlessAmount);
  const tendered = Number(sale.amountTendered);
  const hasCash = Number.isFinite(cashExplicit) && cashExplicit > 0;
  const hasCard = Number.isFinite(cardExplicit) && cardExplicit > 0;
  const hasQr = Number.isFinite(qrExplicit) && qrExplicit > 0;
  let cashAmt = 0;
  let cardAmt = 0;
  let qrAmt = 0;
  if (method === 'CASH' && !hasCard && !hasQr) {
    cashAmt = Number.isFinite(tendered) && tendered > 0
      ? tendered
      : hasCash
        ? cashExplicit
        : total;
  } else if (hasCash || hasCard || hasQr) {
    cashAmt = hasCash ? cashExplicit : 0;
    cardAmt = hasCard ? cardExplicit : 0;
    qrAmt = hasQr ? qrExplicit : 0;
  } else if (method === 'CASHLESS' || method === 'QR') {
    qrAmt = Number.isFinite(tendered) && tendered > 0 ? tendered : total;
  } else if (method === 'CARD') {
    cardAmt = Number.isFinite(tendered) && tendered > 0 ? tendered : total;
  }
  const change = Number(sale.changeGiven) || 0;

  withFieldStyle(printer, styles, 'payment', () => {
    const paymentTitle = String(L.paymentForm || 'To‘lov shakli').replace(/:$/, '') + ':';
    printer.println(paymentTitle);
    if (cashAmt > 0) {
      appendRow(printer, L.cash || 'Naqd', fmtMoney(cashAmt));
    }
    if (cardAmt > 0) {
      appendRow(printer, L.plastic || 'Bank kartasi', fmtMoney(cardAmt));
    }
    if (qrAmt > 0) {
      appendRow(printer, L.qrPayment || 'QR-kodli to‘lov', fmtMoney(qrAmt));
    }
    if (cashAmt <= 0 && cardAmt <= 0 && qrAmt <= 0) {
      appendRow(printer, L.cash || 'Naqd', fmtMoney(total));
    }
    if (cardAmt > 0) {
      if (sale.cardCategoryDisplay || sale.cardType) {
        appendRow(printer, L.cardType || 'Bank kartasi turi', String(sale.cardCategoryDisplay || sale.cardType));
      }
      const rawCard = sale.socialCardNumber || sale.cardNumber;
      if (rawCard) {
        const formatted = formatCardNumberForReceipt(rawCard);
        appendRow(printer, sale.socialCardNumber ? (L.socialCardNumber || 'Ijtimoiy karta') : (L.cardNumber || 'Karta raqami'), formatted);
      }
      if (sale.rrn) {
        appendRow(printer, L.cardRrn || 'RRN kodi', String(sale.rrn));
      }
    }
    if (change > 0) {
      appendRow(printer, L.change || 'Qaytim', fmtMoney(change), true);
    }
  });
  appendDivider(printer);
}

/** Номер электронного рецепта — отдельной строкой, независимо от настроек полей чека. */
function appendPrescription(printer, payload) {
  const { sale, labels } = payload;
  const prescriptionNumber = String(sale?.prescriptionNumber || '').trim();
  if (!prescriptionNumber) return;
  appendRow(printer, (labels || {}).prescriptionNumber || 'Elektron retsept', prescriptionNumber, true);
  appendDivider(printer);
}

function appendFiscalBlock(printer, payload) {
  const { sale, receiptFields, labels, branding, receiptFieldStyles: styles } = payload;
  const fields = receiptFields || {};
  const L = labels || {};

  if (!isOn(fields, 'fiscalBlock')) return;

  withFieldStyle(printer, styles, 'fiscalBlock', () => {
    printer.println(L.fiscalSection || 'Fiskal ma’lumotlar');

    const qrParts = String(sale?.fiscalQrUrl || payload?.qrValue || '');
    const fmFromQr = (qrParts.match(/[?&]t=([^&]+)/i) || [])[1];
    const seqFromQr = (qrParts.match(/[?&]r=([^&]+)/i) || [])[1];
    const virtualRegister = String(branding?.virtualRegister || '').trim();
    const fmNumber = String(sale.fiscalTerminalId || branding?.fmNumber || fmFromQr || '').trim();
    const fiscalReceiptNo = String(sale.fiscalReceiptSeq || seqFromQr || '').trim();
    const fiscalSign = buildFiscalSign(sale);

    if (virtualRegister && virtualRegister !== '1') {
      appendRow(printer, L.virtualRegister || 'Virtual kassa S/R', virtualRegister);
    }
    if (fmNumber) {
      appendRow(printer, L.fmNumber || 'FM raqami', fmNumber);
    }
    if (fiscalReceiptNo) {
      appendRow(printer, L.fiscalReceiptNo || 'Chek raqami', fiscalReceiptNo);
    }
    const lineWidth =
      Number(payload?.paperWmm) && Number(payload.paperWmm) <= 58
        ? 32
        : (typeof printer?.getWidth === 'function' && Number(printer.getWidth())) || 42;
    const appendVersionRow = (label, rawValue) => {
      const lbl = String(label || '').trim();
      const val = String(rawValue || '').trim();
      if (!val) return;
      if (doesVersionRowFitSingleLine(lbl, val, lineWidth)) {
        appendRow(printer, lbl, val);
      } else {
        printer.println(lbl);
        appendRow(printer, '', val);
      }
    };
    appendVersionRow(L.appVersion || 'Versiya', sale.appVersion || payload?.appVersion);
    appendVersionRow(L.desktopVersion || 'Desktop versiyasi', sale.desktopVersion || payload?.desktopVersion);
    appendVersionRow(L.licenseNumber || 'Litsenziya raqami', sale.licenseNumber || payload?.licenseNumber);
    if (fiscalSign) {
      appendRow(printer, L.fiscalSign || 'Fiskal belgi', fiscalSign);
    }
  });
  appendDivider(printer);
}

function appendProfileFooter(printer, payload) {
  const text = String(payload?.labels?.footer || '').trim();
  if (!text || !isOn(payload?.receiptFields, 'footer')) return;
  printer.alignCenter();
  withFieldStyle(printer, payload.receiptFieldStyles, 'footer', () => {
    printer.println(text);
  });
  printer.alignLeft();
}

module.exports = {
  appendMeta,
  appendReceiptType,
  appendItems,
  appendTotals,
  appendPayment,
  appendPrescription,
  appendFiscalBlock,
  appendProfileFooter,
};

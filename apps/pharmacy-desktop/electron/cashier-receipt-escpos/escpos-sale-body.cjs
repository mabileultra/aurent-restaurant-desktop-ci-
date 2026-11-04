/**
 * Body sections of fiscal sale ESC/POS (meta → footer text).
 */
const {
  fmtMoney,
  fmtQty,
  splitDateTime,
  buildFiscalSign,
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
      printer.leftRight(`${L.time || 'Time'}: ${time}`, `${L.date || 'Date'}: ${date}`);
    });
  }
  if (hasReceiptNo && isOn(fields, 'receiptNo')) {
    withFieldStyle(printer, styles, 'receiptNo', () => {
      appendRow(printer, L.receiptNoShort || 'Receipt', String(sale.receiptNumber));
    });
  } else if (hasReceiptNo) {
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
  const tendered = Number(sale.amountTendered);
  const hasCash = Number.isFinite(cashExplicit) && cashExplicit > 0;
  const hasCard = Number.isFinite(cardExplicit) && cardExplicit > 0;
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

  withFieldStyle(printer, styles, 'payment', () => {
    appendRow(printer, L.paymentForm || 'Payment', fmtMoney(total));
    appendRow(printer, L.cash || 'Cash', fmtMoney(cashAmt));
    appendRow(printer, L.plastic || 'Card', fmtMoney(cardAmt));
    if (change > 0) {
      appendRow(printer, L.change || 'Change', fmtMoney(change), true);
    }
  });
  appendDivider(printer);
}

function appendFiscalBlock(printer, payload) {
  const { sale, receiptFields, labels, branding, receiptFieldStyles: styles } = payload;
  const fields = receiptFields || {};
  const L = labels || {};

  if (!isOn(fields, 'fiscalBlock')) return;

  withFieldStyle(printer, styles, 'fiscalBlock', () => {
    printer.println(L.fiscalSection || 'Fiscal');

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
  appendFiscalBlock,
  appendProfileFooter,
};

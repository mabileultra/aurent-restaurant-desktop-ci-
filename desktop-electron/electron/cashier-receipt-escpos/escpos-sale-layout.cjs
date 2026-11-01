/** Shared row / divider helpers for sale ESC/POS. */

function isOn(fields, key) {
  return fields?.[key] !== false;
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

function appendDivider(printer) {
  printer.drawLine();
}

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

module.exports = {
  isOn,
  appendRow,
  appendDivider,
  resolveReceiptTypeDisplay,
  brandingShift,
  itemUnitPrice,
};

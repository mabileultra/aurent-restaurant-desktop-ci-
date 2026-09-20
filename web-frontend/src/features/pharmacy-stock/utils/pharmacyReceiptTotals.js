/** Суммы документа: закуп с НДС × кол-во, розница × кол-во. */

export function linePurchaseSum(line) {
  const unit = Number(line?.purchasePriceWithVat ?? line?.purchasePrice) || 0;
  const qty = Number(line?.quantity) || 0;
  return round2(unit * qty);
}

export function lineRetailSum(line) {
  const unit = Number(line?.retailPrice ?? line?.unitSellingPrice) || 0;
  const qty = Number(line?.quantity) || 0;
  return round2(unit * qty);
}

export function sumReceiptPurchase(lines = []) {
  return round2(lines.reduce((sum, line) => sum + linePurchaseSum(line), 0));
}

export function sumReceiptRetail(lines = []) {
  return round2(lines.reduce((sum, line) => sum + lineRetailSum(line), 0));
}

/** Для карточки: пересчёт из строк, если они есть (иначе поля документа). */
export function receiptDisplayTotals(receipt) {
  const lines = receipt?.lines;
  if (Array.isArray(lines) && lines.length > 0) {
    return {
      purchase: sumReceiptPurchase(lines),
      retail: sumReceiptRetail(lines),
      lineCount: lines.length,
    };
  }
  return {
    purchase: Number(receipt?.totalCost) || 0,
    retail: Number(receipt?.totalRetail) || 0,
    lineCount: receipt?.lineCount ?? 0,
  };
}

function round2(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}

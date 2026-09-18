/** Готовность КМ на строках прихода. */

export function requiredMarkCountForLine(line) {
  if (!line?.markedProduct) return 0;
  const qty = Number(line.quantity);
  if (!Number.isFinite(qty) || qty <= 0) return 0;
  return Math.ceil(qty);
}

export function marksForLine(marksByLineId, lineId) {
  const list = marksByLineId?.[lineId];
  return Array.isArray(list) ? list : [];
}

export function flattenReceiptMarks(marksByLineId, lines = []) {
  const out = [];
  for (const line of lines) {
    if (!line?.id || !line?.productId) continue;
    for (const entry of marksForLine(marksByLineId, line.id)) {
      if (!entry?.code) continue;
      out.push({
        productId: line.productId,
        receiptLineId: line.id,
        markCode: entry.code,
        aslStatus: entry.aslStatus || null,
      });
    }
  }
  return out;
}

export function receiptMarksReady(lines = [], marksByLineId = {}) {
  const marked = lines.filter((line) => line?.markedProduct);
  if (marked.length === 0) {
    return { ok: true, missing: [] };
  }
  const missing = [];
  for (const line of marked) {
    const need = requiredMarkCountForLine(line);
    const have = marksForLine(marksByLineId, line.id).length;
    if (have < need) {
      missing.push({
        lineId: line.id,
        productName: line.productName,
        need,
        have,
      });
    }
  }
  return { ok: missing.length === 0, missing };
}

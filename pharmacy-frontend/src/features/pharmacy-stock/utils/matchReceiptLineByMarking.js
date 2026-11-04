import { markingMatchesProduct } from '../../marking';
import { marksForLine, requiredMarkCountForLine } from './pharmacyReceiptMarks';

function lineAsProduct(line) {
  return {
    id: line?.productId,
    barcode: line?.barcode,
    barcodes: line?.barcode ? [line.barcode] : [],
  };
}

function stillNeedsMark(line, marksByLineId) {
  const need = requiredMarkCountForLine(line);
  if (need <= 0) return false;
  return marksForLine(marksByLineId, line?.id).length < need;
}

/** Найти строку прихода по GTIN из КМ / ASL. Сначала те, кому ещё не хватает кодов. */
export function matchReceiptLineByMarking(lines, rawCode, extraGtins = [], marksByLineId = {}) {
  const marked = (Array.isArray(lines) ? lines : []).filter((line) => line?.markedProduct);
  const hits = marked.filter((line) => markingMatchesProduct(
    lineAsProduct(line),
    rawCode,
    extraGtins,
  ));
  const needing = hits.filter((line) => stillNeedsMark(line, marksByLineId));
  return needing[0] || hits[0] || null;
}

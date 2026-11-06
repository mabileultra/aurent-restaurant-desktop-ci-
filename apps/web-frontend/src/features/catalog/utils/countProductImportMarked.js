import { isRowNew } from '../../../utils/productImportUtils';

/** Сколько строк отмечены как маркированные (editable → tasnif). */
export function countProductImportMarked(rows, editable, tasnifByRow) {
  let n = 0;
  for (const row of rows ?? []) {
    if (!isRowNew(row)) continue;
    const ed = editable?.[row.rowNum];
    if (ed?.markedProduct === true) {
      n += 1;
      continue;
    }
    if (ed?.markedProduct === false) continue;
    if (tasnifByRow?.[row.rowNum]?.markedProduct) n += 1;
  }
  return n;
}

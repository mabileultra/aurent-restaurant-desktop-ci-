import { applyMarkup, isRowNew } from '../../../utils/productImportUtils';

/**
 * Updates importPrice for new rows using given markup percent
 */
export function applyMarkupToRows(prevEditable, rows = [], percent = 0) {
  const next = { ...prevEditable };
  rows.forEach((r) => {
    if (!isRowNew(r) || !next[r.rowNum]) return;
    next[r.rowNum] = {
      ...next[r.rowNum],
      importPrice: applyMarkup(r.fileSellingPrice, percent),
    };
  });
  return next;
}

/**
 * Updates a specific key across all editable rows
 */
export function applyFieldToAllRows(prevEditable, field, value) {
  const next = { ...prevEditable };
  Object.keys(next).forEach((key) => {
    next[key] = { ...next[key], [field]: value };
  });
  return next;
}

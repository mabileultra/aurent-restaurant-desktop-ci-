const KG_UNITS = new Set(['kg', 'кг', 'кг.']);

function isKilogram(row) {
  const unit = String(row?.unitOfMeasure || '').trim().toLowerCase();
  return KG_UNITS.has(unit) || unit.includes('кило');
}

/** Штука и литр — шаг 1. Килограмм — 0.001. */
export function importQtyStep(row) {
  return isKilogram(row) ? 0.001 : 1;
}

export function bumpImportQty(current, row, direction) {
  const step = importQtyStep(row);
  const base = current === '' || current == null ? 0 : Number(current);
  const next = Math.max(0, (Number.isFinite(base) ? base : 0) + direction * step);
  if (step >= 1) return String(Math.round(next));
  return String(Math.round(next * 1000) / 1000);
}

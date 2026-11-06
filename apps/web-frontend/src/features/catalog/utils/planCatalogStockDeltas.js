function roundQty(value) {
  return Math.round((Number(value) || 0) * 1000) / 1000;
}

/**
 * Поле «Начальный остаток» в карточке — общий остаток товара, не остаток одного магазина.
 * Плюс кладётся на выбранный магазин, минус снимается с магазинов, у которых есть количество.
 */
export function planCatalogStockDeltas({ desiredTotal, quantitiesByStore, preferredStoreId }) {
  const rows = Object.entries(quantitiesByStore || {})
    .map(([id, qty]) => ({ storeId: Number(id), qty: roundQty(qty) }))
    .filter((row) => Number.isFinite(row.storeId));
  if (!rows.length || !Number.isFinite(Number(desiredTotal))) return [];

  const preferred = preferredStoreId != null && preferredStoreId !== ''
    ? Number(preferredStoreId)
    : rows[0].storeId;
  rows.sort((a, b) => {
    if (a.storeId === preferred) return -1;
    if (b.storeId === preferred) return 1;
    return a.storeId - b.storeId;
  });

  const total = roundQty(rows.reduce((sum, row) => sum + row.qty, 0));
  const delta = roundQty(Number(desiredTotal) - total);
  if (delta === 0) return [];
  if (delta > 0) return [{ storeId: rows[0].storeId, delta }];

  let remaining = -delta;
  const plans = [];
  for (const row of rows) {
    if (remaining <= 0) break;
    const take = roundQty(Math.min(Math.max(row.qty, 0), remaining));
    if (take <= 0) continue;
    plans.push({ storeId: row.storeId, delta: -take });
    remaining = roundQty(remaining - take);
  }
  return plans;
}

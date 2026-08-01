/** Положительная конечная цена (отсекает NaN/''/0 от valueAsNumber). */
export function toPositivePrice(value) {
  if (value === '' || value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Цены по магазинам для API: пустое поле → базовая цена продажи. */
export function buildStorePrices(rows, sellingPrice) {
  const base = toPositivePrice(sellingPrice);
  if (base == null) return [];
  return rows
    .filter((r) => r.storeId !== '' && r.storeId != null)
    .map((r) => {
      const parsed = toPositivePrice(r.price);
      const price = parsed != null ? parsed : base;
      return { storeId: Number(r.storeId), price };
    });
}

/**
 * Подставляет цену продажи в строки магазинов, если цена не задана,
 * совпадает с прежней ценой продажи или ошибочно равна себестоимости.
 */
export function syncStoreRowPrices(rows, nextSelling, prevSelling, costPrice) {
  const next = toPositivePrice(nextSelling);
  if (next == null) return rows;
  const prev = toPositivePrice(prevSelling);
  const cost = toPositivePrice(costPrice);

  return rows.map((r) => {
    if (r.storeId === '' || r.storeId == null) return r;
    const p = toPositivePrice(r.price);
    const matchesPrev = prev != null && p === prev;
    const matchesCost = cost != null && p === cost && cost !== next;
    const empty = p == null;
    if (empty || matchesPrev || matchesCost) {
      return { ...r, price: String(next) };
    }
    return r;
  });
}

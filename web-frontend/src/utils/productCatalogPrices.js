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
 * Если блок «цены по магазинам» скрыт — не берём цену из storeRows
 * (там может остаться устаревшее значение вроде 1), только розничную.
 * Без storeId касса товар не видит: fallback — выбранный магазин, иначе все активные.
 */
export function resolveStorePricesForPayload({
  storeRows,
  sellingPrice,
  storePricesEnabled = true,
  fallbackStoreId = null,
  fallbackStoreIds = null,
}) {
  const base = toPositivePrice(sellingPrice);
  if (base == null) return [];

  if (storePricesEnabled) {
    return buildStorePrices(storeRows, sellingPrice);
  }

  // Блок скрыт → розничная цена во все активные магазины (не только в устаревшие storeRows).
  const ids = [];
  if (Array.isArray(fallbackStoreIds) && fallbackStoreIds.length > 0) {
    for (const raw of fallbackStoreIds) {
      const id = Number(raw);
      if (!Number.isFinite(id) || ids.includes(id)) continue;
      ids.push(id);
    }
  }
  if (ids.length === 0) {
    for (const row of storeRows || []) {
      if (row?.storeId === '' || row?.storeId == null) continue;
      const id = Number(row.storeId);
      if (!Number.isFinite(id) || ids.includes(id)) continue;
      ids.push(id);
    }
  }
  if (ids.length === 0 && fallbackStoreId != null && fallbackStoreId !== '') {
    const id = Number(fallbackStoreId);
    if (Number.isFinite(id)) ids.push(id);
  }
  // Начальный остаток пишется только в первый магазин списка — выбранный должен быть первым.
  if (ids.length > 1 && fallbackStoreId != null && fallbackStoreId !== '') {
    const selected = Number(fallbackStoreId);
    const idx = ids.indexOf(selected);
    if (idx > 0) {
      ids.splice(idx, 1);
      ids.unshift(selected);
    }
  }
  return ids.map((storeId) => ({ storeId, price: base }));
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

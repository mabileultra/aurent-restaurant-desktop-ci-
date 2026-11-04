import { pharmacyWarehouseApi } from '../../../api';

/** Сколько UUID в одном GET /fefo-hints — иначе URL обрезается и серия/срок пустые. */
export const PHARMACY_FEFO_HINT_CHUNK = 40;

/**
 * Загрузка FEFO-подсказок кусками подряд (без параллельного шторма на API).
 */
export async function fetchPharmacyFefoHints(storeId, productIds = []) {
  const ids = [...new Set((productIds || []).map((id) => String(id || '').trim()).filter(Boolean))];
  if (!storeId || ids.length === 0) return [];

  const out = [];
  for (let i = 0; i < ids.length; i += PHARMACY_FEFO_HINT_CHUNK) {
    const chunk = ids.slice(i, i + PHARMACY_FEFO_HINT_CHUNK);
    const res = await pharmacyWarehouseApi.fefoHints({
      storeId,
      productIds: chunk.join(','),
    });
    out.push(...(res.data ?? []));
  }
  return out;
}

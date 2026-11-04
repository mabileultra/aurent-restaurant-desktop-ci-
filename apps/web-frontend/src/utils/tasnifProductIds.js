/**
 * Авто-идентификаторы товара из Tasnif (ИКПУ + упаковка).
 * Разные упаковки одного ИКПУ → разные SKU / ID, без конфликта 409.
 */

export function buildTasnifSku(mxik, packageCode) {
  const m = String(mxik || '').trim();
  if (!m) return '';
  const p = String(packageCode || '').trim();
  return p ? `IKPU-${m}-P${p}` : `IKPU-${m}`;
}

/** Внешний ID товара: ИКПУ или ИКПУ:кодУпаковки */
export function buildTasnifExternalId(mxik, packageCode) {
  const m = String(mxik || '').trim();
  if (!m) return '';
  const p = String(packageCode || '').trim();
  return p ? `${m}:${p}` : m;
}

/** SKU, который раньше/сейчас ставит Tasnif — можно перезаписать новой упаковкой */
export function isAutoTasnifSku(sku) {
  return /^IKPU-/i.test(String(sku || '').trim());
}

/** ID, похожий на авто из Tasnif (чистый ИКПУ или ИКПУ:упаковка) */
export function isAutoTasnifExternalId(value, mxik) {
  const v = String(value || '').trim();
  if (!v) return true;
  const m = String(mxik || '').trim();
  if (m && (v === m || v.startsWith(`${m}:`))) return true;
  return /^\d{10,}(:[\w-]+)?$/.test(v);
}

/**
 * Авто-идентификаторы товара из Tasnif (ИКПУ + упаковка).
 */

export function buildTasnifSku(mxik, packageCode) {
  const m = String(mxik || '').trim();
  if (!m) return '';
  const p = String(packageCode || '').trim();
  return p ? `IKPU-${m}-P${p}` : `IKPU-${m}`;
}

export function buildTasnifExternalId(mxik, packageCode) {
  const m = String(mxik || '').trim();
  if (!m) return '';
  const p = String(packageCode || '').trim();
  return p ? `${m}:${p}` : m;
}

export function isAutoTasnifSku(sku) {
  return /^IKPU-/i.test(String(sku || '').trim());
}

export function isAutoTasnifExternalId(value, mxik) {
  const v = String(value || '').trim();
  if (!v) return true;
  const m = String(mxik || '').trim();
  if (m && (v === m || v.startsWith(`${m}:`))) return true;
  return /^\d{10,}(:[\w-]+)?$/.test(v);
}

const digitsOnly = (v) => String(v || '').replace(/\D/g, '');

export function isRetailBarcode(raw) {
  const d = digitsOnly(raw);
  return d.length === 8 || d.length === 12 || d.length === 13 || d.length === 14;
}

/** Штрихкод в карточку из Tasnif — только реальный EAN/GTIN. */
export function resolveCatalogBarcodeFromTasnif(item, searchQuery = '', pkg = null) {
  const mxik = item?.mxik && String(item.mxik).trim();
  const candidates = [item?.barcode, item?.internalCode, pkg?.barcode, searchQuery];
  for (const raw of candidates) {
    if (!raw || !String(raw).trim()) continue;
    const value = String(raw).trim();
    if (mxik && (value === mxik || digitsOnly(value) === digitsOnly(mxik))) continue;
    if (isRetailBarcode(value)) return digitsOnly(value);
  }
  return '';
}

const digitsOnly = (v) => String(v || '').replace(/\D/g, '');

/**
 * Штрихкод для печати этикетки из карточки каталога.
 * Приоритет: основной → дополнительные → артикул → код упаковки → цифры запроса (≥8).
 */
export function resolveLabelBarcodeFromProduct(data, searchQuery = '') {
  const main = data?.barcode && String(data.barcode).trim();
  if (main) return main;

  if (Array.isArray(data?.barcodes)) {
    const extra = data.barcodes.find((b) => String(b || '').trim());
    if (extra) return String(extra).trim();
  }

  const sku = data?.sku && String(data.sku).trim();
  if (sku) return sku;

  const packageCode = data?.packageCode && String(data.packageCode).trim();
  if (packageCode) return packageCode;

  const q = digitsOnly(searchQuery);
  if (q.length >= 8) return q;

  const id = data?.id && String(data.id).replace(/-/g, '');
  if (id) return `20${id.slice(0, 11)}`;

  return '';
}

/** EAN/UPC для карточки каталога — не ИКПУ и не короткий код упаковки. */
export function isRetailBarcode(raw) {
  const d = digitsOnly(raw);
  return d.length === 8 || d.length === 12 || d.length === 13 || d.length === 14;
}

/**
 * Штрихкод в карточку товара из Tasnif.
 * Только реальный EAN/GTIN; ИКПУ и код упаковки сюда не пишем (иначе 409).
 */
export function resolveCatalogBarcodeFromTasnif(item, searchQuery = '', pkg = null) {
  const mxik = item?.mxik && String(item.mxik).trim();
  const candidates = [
    item?.barcode,
    item?.internalCode,
    pkg?.barcode,
    searchQuery,
  ];
  for (const raw of candidates) {
    if (!raw || !String(raw).trim()) continue;
    const value = String(raw).trim();
    if (mxik && (value === mxik || digitsOnly(value) === digitsOnly(mxik))) continue;
    if (isRetailBarcode(value)) return digitsOnly(value);
  }
  return '';
}

/**
 * Штрихкод для печати этикетки из Tasnif (с запасными вариантами).
 */
export function resolveLabelBarcodeFromTasnif(item, searchQuery = '', pkg = null) {
  const catalog = resolveCatalogBarcodeFromTasnif(item, searchQuery, pkg);
  if (catalog) return catalog;

  const fromApi = item?.barcode || item?.internalCode;
  if (fromApi && String(fromApi).trim()) {
    return String(fromApi).trim();
  }

  const pkgCode = pkg?.code && String(pkg.code).trim();
  if (pkgCode) return pkgCode;

  const mxik = item?.mxik && String(item.mxik).trim();
  const q = digitsOnly(searchQuery);
  if (q.length >= 8) return q;

  if (mxik) return mxik;

  return '';
}

export { digitsOnly };

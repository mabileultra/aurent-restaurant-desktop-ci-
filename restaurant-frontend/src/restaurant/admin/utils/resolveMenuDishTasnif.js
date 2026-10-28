import { tasnifApi } from '../../../api';
import { isRealFiscalPackageCode } from '../../../services/fiscal/shared/resolveFiscalPackageCodes';
import {
  buildTasnifSku,
  resolveCatalogBarcodeFromTasnif,
} from '../../../utils/tasnifProductIds';

function packageUnitLabel(pkg, lang) {
  if (!pkg) return '';
  return lang === 'ru'
    ? (pkg.nameRu || pkg.nameUz || pkg.nameLat || '')
    : (pkg.nameUz || pkg.nameRu || pkg.nameLat || '');
}

/**
 * Resolve first Tasnif match by dish name / tasnifQuery and apply fiscal fields.
 * @returns {Promise<{ ok: boolean, patch?: object, reason?: string }>}
 */
export async function resolveMenuDishTasnif(query, { lang = 'ru', fillSku = true } = {}) {
  const q = String(query || '').trim();
  if (q.length < 2) {
    return { ok: false, reason: 'short' };
  }

  let items = [];
  try {
    const res = await tasnifApi.search({ q, lang, page: 0, size: 10 });
    items = res.data?.items ?? [];
  } catch {
    return { ok: false, reason: 'unavailable' };
  }
  if (!items.length) {
    return { ok: false, reason: 'not_found' };
  }

  let full = items[0];
  let packages = (full.packages ?? []).filter((pkg) => isRealFiscalPackageCode(pkg?.code));
  // Detail only when search row has no usable packages (saves 1 RTT per dish).
  if (full?.mxik && !packages.length) {
    try {
      const detail = await tasnifApi.detail({ mxik: full.mxik, lang });
      full = detail.data || full;
      packages = (full.packages ?? []).filter((pkg) => isRealFiscalPackageCode(pkg?.code));
    } catch {
      /* keep search row */
    }
  }

  const pkg = packages[0] ?? null;
  const mxik = full.mxik ? String(full.mxik) : '';
  const packageCode = pkg?.code != null ? String(pkg.code).trim() : '';

  const patch = {
    ikpu: mxik || null,
    markedProduct: Boolean(full.markedProduct),
  };

  const barcode = resolveCatalogBarcodeFromTasnif(full, q, pkg);
  if (barcode) patch.barcode = barcode;

  if (pkg) {
    const unit = packageUnitLabel(pkg, lang);
    if (unit) patch.unitOfMeasure = unit;
    if (pkg.packageType) patch.unitMeasureCode = String(pkg.packageType);
    if (packageCode) patch.packageCode = packageCode;
  }

  if (fillSku && mxik) {
    patch.sku = buildTasnifSku(mxik, packageCode);
  }

  return {
    ok: Boolean(mxik),
    patch,
    reason: mxik ? undefined : 'no_mxik',
    matchedName: full.name || '',
  };
}

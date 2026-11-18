import {
  digitsOnly,
  resolveLabelBarcodeFromProduct,
  resolveLabelBarcodeFromTasnif,
} from '../../../utils/labelBarcode';
import { loadCatalogProductDetails } from './usersBarcodePrintUtils';

export function parsePreviewPrice(priceInput) {
  if (typeof priceInput !== 'string' || priceInput.trim() === '') return 0;
  return Math.max(0, parseFloat(priceInput.replace(',', '.')) || 0);
}

export async function createDraftFromCatalogProduct(data, searchQuerySaved = '') {
  const full = await loadCatalogProductDetails(data);
  if (!full?.name) return null;
  const barcode = resolveLabelBarcodeFromProduct(full, searchQuerySaved);
  return {
    name: full.name,
    barcode,
    price:
      typeof full.sellingPrice === 'number'
        ? full.sellingPrice
        : parseFloat(full.sellingPrice) || 0,
    source: 'catalog',
    mxik: full.ikpu ?? null,
  };
}

export function createDraftFromTasnif(item, pkg, searchQuerySaved, lang) {
  if (!item?.name) return null;
  let unitLabel = '';
  if (pkg) {
    unitLabel =
      lang === 'ru'
        ? pkg.nameRu || pkg.nameUz || pkg.nameLat
        : pkg.nameUz || pkg.nameRu || pkg.nameLat;
  }
  const barcode = resolveLabelBarcodeFromTasnif(item, searchQuerySaved, pkg);
  const nameSuffix = unitLabel ? ` (${String(unitLabel).trim()})` : '';
  return {
    name: `${item.name.trim()}${nameSuffix}`,
    barcode,
    price: 0,
    source: 'tasnif',
    mxik: item.mxik ?? null,
  };
}

export async function lookupTasnifByBarcodeOrQuery(raw, lang, tasnifApi) {
  const digitKey = digitsOnly(raw);

  async function tasLookup(code) {
    if (!code) return null;
    try {
      const { data } = await tasnifApi.lookup({ barcode: code.trim(), lang });
      return data;
    } catch {
      return null;
    }
  }

  let lk = digitKey.length >= 8 ? await tasLookup(digitKey) : null;
  if (!lk) lk = await tasLookup(raw);
  if (!lk && digitKey.length >= 8 && digitKey !== raw) lk = await tasLookup(`${digitKey}`);
  return lk;
}

import toast from 'react-hot-toast';
import { productApi, tasnifApi } from '../../../api';

export async function executeBarcodeLookup({
  raw,
  lang,
  applyCatalogProduct,
  searchCatalog,
  applyTasnifToDraft,
  pickTasnifItem,
  setPendingQuery,
  setPackageItem,
  setCatalogResults,
  setTasnifResults,
  t,
}) {
  try {
    const { data } = await productApi.getByBarcode(raw);
    if (await applyCatalogProduct(data, raw)) return;
  } catch {}

  const catalogHit = await searchCatalog(raw);
  if (catalogHit === 'done' || catalogHit === 'pick-catalog') return;

  const lk = await lookupTasnifByBarcodeOrQuery(raw, lang, tasnifApi);
  if (lk) {
    const fakeItem = {
      mxik: lk.mxik,
      name: lk.name || lk.description,
      barcode: lk.barcode,
      packages: [],
    };
    if (fakeItem.mxik) {
      try {
        const res = await tasnifApi.detail({ mxik: fakeItem.mxik, lang });
        const full = res.data;
        const packages = full.packages ?? [];
        if (packages.length > 1) {
          setPendingQuery(raw);
          setPackageItem(full);
          return;
        }
        applyTasnifToDraft(full, packages[0] ?? null, raw);
        return;
      } catch {
        applyTasnifToDraft(fakeItem, null, raw);
        return;
      }
    }
    applyTasnifToDraft(fakeItem, null, raw);
    return;
  }

  setPendingQuery(raw);
  const { data } = await tasnifApi.search({ q: raw, lang, page: 0, size: 20 });
  const items = data?.items ?? [];
  if (!items.length) {
    toast.error(t('usersBarcodePrint.notFoundAnywhere'));
    return;
  }
  if (items.length === 1) {
    await pickTasnifItem(items[0]);
    return;
  }
  setTasnifResults(items);
  toast(t('usersBarcodePrint.pickFromListHint'), { icon: 'ℹ️' });
}

import { BARCODE_PRINT_CATALOG_SEARCH_SIZE } from './usersBarcodePrintUtils';

export async function searchCatalogProducts({
  raw,
  applyCatalogProduct,
  setCatalogResults,
  setTasnifResults,
  t,
}) {
  const { data } = await productApi.getAll({
    search: raw,
    activeOnly: true,
    page: 0,
    size: BARCODE_PRINT_CATALOG_SEARCH_SIZE,
  });
  const items = data?.content ?? [];
  if (items.length === 1) {
    await applyCatalogProduct(items[0], raw);
    return 'done';
  }
  if (items.length > 1) {
    setCatalogResults(items);
    setTasnifResults([]);
    toast(t('usersBarcodePrint.pickFromCatalogHint'), { icon: 'ℹ️' });
    return 'pick-catalog';
  }
  return 'none';
}

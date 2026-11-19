import { tasnifApi } from '../../api/tasnif.api';
import { barcodeLookupVariants, markingBarcodeCandidates } from './markingCode';
import {
  findProductByMarkingCode,
  markingMatchesProduct,
} from './markingProductMatch';

function pageItems(page) {
  if (Array.isArray(page)) return page;
  if (Array.isArray(page?.content)) return page.content;
  return [];
}

function digitsOnly(value) {
  return String(value ?? '').replace(/\D/g, '');
}

function findInList(items, mark, extraGtins) {
  return (items || []).find((product) => markingMatchesProduct(product, mark, extraGtins)
    || findProductByMarkingCode([product], mark));
}

function findByIkpu(items, mxik) {
  const wanted = digitsOnly(mxik);
  if (wanted.length < 8) return null;
  return (items || []).find((product) => digitsOnly(product?.ikpu) === wanted) || null;
}

async function firstCatalogHit(searchCatalog, queries, pick) {
  if (!searchCatalog) return null;
  const unique = [...new Set(queries.filter(Boolean))];
  for (const query of unique.slice(0, 6)) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const hit = pick(pageItems(await searchCatalog(query)));
      if (hit) return hit;
    } catch {
      /* next */
    }
  }
  return null;
}

function tasnifMxik(tasnif) {
  return digitsOnly(tasnif?.mxik || tasnif?.ikpu || tasnif?.classCode);
}

function defaultTasnifLookup(barcode) {
  return tasnifApi.lookup({ barcode }).then((r) => r.data);
}

async function lookupTasnifForMark(candidates, lookupTasnifByBarcode) {
  if (!lookupTasnifByBarcode) return null;
  for (const barcode of candidates) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const data = await lookupTasnifByBarcode(barcode);
      if (tasnifMxik(data) || String(data?.name || '').trim()) return data;
    } catch {
      /* next GTIN variant */
    }
  }
  return null;
}

/** Карточка только из Tasnif — чтобы спросить оборот, даже если склада нет. */
export function productStubFromTasnif(tasnif) {
  const ikpu = tasnifMxik(tasnif);
  if (!ikpu) return null;
  return {
    ikpu,
    packageCode: digitsOnly(tasnif?.packageCode || tasnif?.package_code),
    name: String(tasnif?.name || '').trim(),
    barcode: tasnif?.barcode || '',
    markedProduct: true,
  };
}

export async function lookupTasnifIdentity(mark, extraGtins = [], lookupTasnifByBarcode = defaultTasnifLookup) {
  const tasnif = await lookupTasnifForMark(
    markingBarcodeCandidates(mark, extraGtins),
    lookupTasnifByBarcode,
  );
  return productStubFromTasnif(tasnif);
}

function tasnifWarehouseQueries(tasnif) {
  const queries = [];
  const mxik = tasnifMxik(tasnif);
  if (mxik) queries.push(mxik);
  for (const barcode of barcodeLookupVariants(tasnif?.barcode)) {
    queries.push(barcode);
  }
  const name = String(tasnif?.name || '').trim();
  if (name.length >= 4) queries.push(name);
  return queries;
}

/** Коды для точечного by-barcode: ИКПУ (аптека findByScan) + штрих Tasnif. */
function tasnifFetchCodes(tasnif) {
  const codes = [];
  const mxik = tasnifMxik(tasnif);
  if (mxik) codes.push(mxik);
  for (const barcode of barcodeLookupVariants(tasnif?.barcode)) {
    codes.push(barcode);
  }
  const pack = digitsOnly(tasnif?.packageCode || tasnif?.package_code);
  if (pack.length >= 8) codes.push(pack);
  return codes;
}

function findByTasnif(items, tasnif) {
  const byIkpu = findByIkpu(items, tasnifMxik(tasnif));
  if (byIkpu) return byIkpu;
  const wanted = String(tasnif?.name || '').trim().toLowerCase();
  if (wanted.length < 4) return null;
  const hits = (items || []).filter((product) => {
    const name = String(product?.name || '').trim().toLowerCase();
    return name && (name === wanted || name.includes(wanted) || wanted.includes(name));
  });
  if (hits.length === 1) return hits[0];
  return hits.find((product) => String(product?.name || '').trim().toLowerCase() === wanted) || null;
}

async function fetchFirstByCodes(fetchByBarcode, codes) {
  if (!fetchByBarcode) return null;
  const unique = [...new Set((codes || []).filter(Boolean))];
  for (const code of unique) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const hit = await fetchByBarcode(code);
      if (hit?.id) return hit;
    } catch (error) {
      const status = error?.response?.status;
      if (status !== 404 && status !== 400) throw error;
    }
  }
  return null;
}

/**
 * Товар по маркировке: GTIN → штрихкод; нет карточки — Tasnif ИКПУ →
 * точечный by-barcode/ИКПУ, потом поиск склада по ИКПУ/имени.
 */
export async function lookupProductByMarkingGtin({
  products,
  mark,
  extraGtins = [],
  fetchByBarcode,
  searchCatalog,
  lookupTasnifByBarcode = defaultTasnifLookup,
}) {
  const local = findProductByMarkingCode(products, mark)
    || extraGtins.map((gtin) => findProductByMarkingCode(products, `01${gtin}`)).find(Boolean);
  if (local) return local;

  const candidates = markingBarcodeCandidates(mark, extraGtins);

  const byGtinBarcode = await fetchFirstByCodes(fetchByBarcode, candidates);
  if (byGtinBarcode) return byGtinBarcode;

  const byGtinCatalog = await firstCatalogHit(
    searchCatalog,
    candidates,
    (items) => findInList(items, mark, extraGtins),
  );
  if (byGtinCatalog) return byGtinCatalog;

  // Не стопоримся на первом Tasnif: чужой MXIK / пустой shtrixCode на одном GTIN.
  for (const barcode of candidates) {
    let tasnif = null;
    try {
      // eslint-disable-next-line no-await-in-loop
      tasnif = await lookupTasnifByBarcode(barcode);
    } catch {
      tasnif = null;
    }
    if (!tasnifMxik(tasnif) && !String(tasnif?.name || '').trim()) continue;

    const byTasnif = findByTasnif(products, tasnif);
    if (byTasnif) return byTasnif;

    // Аптека: getByBarcode(ИКПУ) — даже если на карточке пустой barcode.
    // eslint-disable-next-line no-await-in-loop
    const byIkpuScan = await fetchFirstByCodes(fetchByBarcode, tasnifFetchCodes(tasnif));
    if (byIkpuScan) return byIkpuScan;

    // eslint-disable-next-line no-await-in-loop
    const warehouse = await firstCatalogHit(
      searchCatalog,
      tasnifWarehouseQueries(tasnif),
      (items) => findByTasnif(items, tasnif) || findInList(items, mark, extraGtins),
    );
    if (warehouse) return warehouse;
  }
  return null;
}

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

/**
 * Товар по маркировке: GTIN из КМ → штрихкод / склад.
 * Нет карточки по штрихкоду — Tasnif (ИКПУ / имя) → снова склад.
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

  for (const barcode of candidates) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const hit = await fetchByBarcode?.(barcode);
      if (hit?.id) return hit;
    } catch (error) {
      const status = error?.response?.status;
      if (status !== 404 && status !== 400) throw error;
    }
  }

  const byGtinCatalog = await firstCatalogHit(
    searchCatalog,
    candidates,
    (items) => findInList(items, mark, extraGtins),
  );
  if (byGtinCatalog) return byGtinCatalog;

  const tasnif = await lookupTasnifForMark(candidates, lookupTasnifByBarcode);
  if (!tasnif) return null;

  const byTasnif = findByTasnif(products, tasnif);
  if (byTasnif) return byTasnif;

  return firstCatalogHit(
    searchCatalog,
    tasnifWarehouseQueries(tasnif),
    (items) => findByTasnif(items, tasnif) || findInList(items, mark, extraGtins),
  );
}

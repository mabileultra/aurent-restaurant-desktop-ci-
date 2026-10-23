import { tasnifApi } from '../../../api/tasnif.api';
import { extractGtinFromMarkingCode, markingBarcodeCandidates } from './pharmacyMarkingCode';
import {
  findProductByMarkingCode,
  markingMatchesProduct,
} from './pharmacyMarkingProductMatch';

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
  for (const query of unique.slice(0, 4)) {
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

/**
 * Товар по DataMatrix без ASL: GTIN из КМ → сразу Tasnif (ОФД/ИКПУ) → каталог.
 * extraGtins — только варианты GTIN из самого кода, не ответ ASL.
 */
export async function lookupProductByMarkingGtin({
  products,
  mark,
  extraGtins = [],
  fetchByBarcode,
  searchCatalog,
  lookupTasnifByBarcode = (barcode) => tasnifApi.lookup({ barcode }).then((r) => r.data),
}) {
  const local = findProductByMarkingCode(products, mark)
    || extraGtins.map((gtin) => findProductByMarkingCode(products, `01${gtin}`)).find(Boolean);
  if (local) return local;

  const candidates = markingBarcodeCandidates(mark, extraGtins);
  const gtin = candidates.find((code) => code.length >= 8) || extractGtinFromMarkingCode(mark);

  const tasnifPromise = gtin && lookupTasnifByBarcode
    ? Promise.resolve()
      .then(() => lookupTasnifByBarcode(gtin))
      .catch(() => null)
    : Promise.resolve(null);

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

  const tasnif = await tasnifPromise;
  const mxik = tasnifMxik(tasnif);
  if (mxik) {
    const byIkpu = findByIkpu(products, mxik);
    if (byIkpu) return byIkpu;
  }

  return firstCatalogHit(
    searchCatalog,
    [mxik, ...candidates].filter(Boolean),
    (items) => (mxik && findByIkpu(items, mxik)) || findInList(items, mark, extraGtins),
  );
}

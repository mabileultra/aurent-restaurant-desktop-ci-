import { tasnifApi } from '../../../api';
import { isRowNew } from '../../../utils/productImportUtils';
import { isRealFiscalPackageCode } from '../../../services/fiscal/shared/resolveFiscalPackageCodes';

const CONCURRENCY = 4;

function pickPackageCode(item) {
  const packages = item?.packages ?? [];
  const real = packages.find((pkg) => isRealFiscalPackageCode(pkg?.code));
  if (real?.code != null) return String(real.code).trim();
  const first = packages[0];
  return first?.code != null ? String(first.code).trim() : '';
}

function extractBarcode(data) {
  return String(
    data?.barcode
    || data?.shtrixCode
    || data?.internalCode
    || data?.internal_code
    || ''
  ).trim();
}

function normalizeLookup(data, matchSource) {
  if (!data) return null;
  const mxik = String(data.mxik || data.ikpu || '').trim();
  if (!mxik && !data.name) return null;
  return {
    status: 'found',
    matchSource,
    ikpu: mxik || '',
    barcode: extractBarcode(data),
    packageCode: pickPackageCode(data),
    markedProduct: Boolean(data.markedProduct),
    tasnifName: data.name || '',
    message: '',
  };
}

async function verifyOneRow(row, lang) {
  const barcode = String(row.barcode || '').trim();
  const ikpu = String(row.ikpu || '').trim();
  const name = String(row.name || '').trim();

  try {
    if (barcode) {
      const res = await tasnifApi.lookup({ barcode, lang });
      const hit = normalizeLookup(res.data, 'barcode');
      if (hit) return { ...hit, barcode: hit.barcode || barcode };
      return { status: 'missing', matchSource: 'barcode', message: 'not_found' };
    }

    if (ikpu) {
      const res = await tasnifApi.lookup({ ikpu, lang });
      const hit = normalizeLookup(res.data, 'ikpu');
      if (hit) return hit;
      return { status: 'missing', matchSource: 'ikpu', message: 'not_found' };
    }

    if (name.length >= 2) {
      const res = await tasnifApi.search({ q: name, lang, page: 0, size: 8 });
      const items = res.data?.items ?? [];
      const exact = items.find(
        (item) => String(item.name || '').trim().toLowerCase() === name.toLowerCase()
      );
      const item = exact || items[0];
      if (!item) {
        return { status: 'missing', matchSource: 'name', message: 'not_found' };
      }
      let full = item;
      if (item.mxik) {
        try {
          const detail = await tasnifApi.detail({ mxik: item.mxik, lang });
          full = detail.data || item;
        } catch {
          /* keep search row */
        }
      }
      const hit = normalizeLookup(full, 'name');
      if (hit) return hit;
      return { status: 'missing', matchSource: 'name', message: 'not_found' };
    }

    return { status: 'missing', matchSource: 'none', message: 'no_query' };
  } catch {
    return { status: 'missing', matchSource: 'error', message: 'lookup_failed' };
  }
}

async function mapPool(items, limit, worker) {
  const results = new Array(items.length);
  let next = 0;
  async function run() {
    while (next < items.length) {
      const idx = next;
      next += 1;
      results[idx] = await worker(items[idx], idx);
    }
  }
  const runners = Array.from({ length: Math.min(limit, items.length) }, () => run());
  await Promise.all(runners);
  return results;
}

/**
 * Параллельная проверка строк в tasnif.
 * Штрихкод → lookup; иначе ИКПУ; иначе имя.
 * Если в фактуре нет штрихкода, а в тасниф есть — подставляем.
 */
export async function verifyProductImportRowsTasnif(rows, { lang = 'ru', onProgress } = {}) {
  const targets = (rows ?? []).filter((row) => isRowNew(row));
  const byRow = {};

  for (const row of rows ?? []) {
    if (!isRowNew(row)) {
      byRow[row.rowNum] = { status: 'idle' };
    }
  }

  let done = 0;
  await mapPool(targets, CONCURRENCY, async (row) => {
    byRow[row.rowNum] = { status: 'checking' };
    onProgress?.({ ...byRow });
    const result = await verifyOneRow(row, lang);
    byRow[row.rowNum] = result;
    done += 1;
    onProgress?.({ ...byRow }, done, targets.length);
    return result;
  });

  return byRow;
}

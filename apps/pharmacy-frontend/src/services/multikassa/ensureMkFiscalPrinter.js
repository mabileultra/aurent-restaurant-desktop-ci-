import { getPrintersWithFallback, selectPrinter } from './multikassaHttpClient';
import { isDummyMkPrinterName, parseMkFiscalPrinters, pickMkFiscalPrinterToSelect } from './parseMkFiscalPrinters';

export const MK_PRINTER_CACHE_TTL_MS = 180_000;
const mkPrinterCache = new Map();
const mkPrinterInFlight = new Map();

export function invalidateMkFiscalPrinterCache(baseUrl) {
  const key = String(baseUrl || '').trim().replace(/\/+$/, '');
  if (!key) {
    mkPrinterCache.clear();
    mkPrinterInFlight.clear();
    return;
  }
  mkPrinterCache.delete(key);
  mkPrinterInFlight.delete(key);
}

export function clearMkFiscalPrinterCache() {
  mkPrinterCache.clear();
  mkPrinterInFlight.clear();
}

function selectBody(name, paperWidth) {
  const width = Number(paperWidth) > 0 ? Number(paperWidth) : 80;
  return {
    printerName: name,
    PrinterName: name,
    selectedPrinter: name,
    paperWidth: width,
    selectedPaperWidth: width,
  };
}

/**
 * MK Fiscal должен фискализировать без своей бумаги: «(не печатать)» или PDF.
 * Печатает Aurent ESC/POS. Реальный XP/thermal в MK не выбираем — иначе два чека.
 */
export async function ensureMkFiscalPrinter(baseUrl, deps = {}) {
  const getList = deps.getPrintersWithFallback || getPrintersWithFallback;
  const select = deps.selectPrinter || selectPrinter;
  const url = String(baseUrl || '').trim().replace(/\/+$/, '');
  if (!url) {
    return {
      printers: [],
      labels: [],
      selected: '',
      selectedValid: false,
      silent: false,
      changed: false,
    };
  }

  const hasCustomDeps = Boolean(deps.getPrintersWithFallback || deps.selectPrinter);
  const useCache = deps.useCache !== undefined ? Boolean(deps.useCache) : !hasCustomDeps;
  const forceRefresh = Boolean(deps.forceRefresh);
  const nowFn = deps.now || Date.now;
  const ttlMs = Number(deps.ttlMs) > 0 ? Number(deps.ttlMs) : MK_PRINTER_CACHE_TTL_MS;

  if (useCache && !forceRefresh) {
    const cached = mkPrinterCache.get(url);
    if (cached && nowFn() - cached.at < ttlMs) {
      return cached.result;
    }
    const pending = mkPrinterInFlight.get(url);
    if (pending) return pending;
  }

  const task = (async () => {
    const { data: raw } = await getList(url);
    const parsed = parseMkFiscalPrinters(raw);
    const name = pickMkFiscalPrinterToSelect(parsed);
    if (!name) {
      return { ...parsed, selected: parsed.selected || '', silent: false, changed: false };
    }
    const silent = isDummyMkPrinterName(name);
    let result;
    if (parsed.selected === name) {
      result = { ...parsed, silent, changed: false };
    } else {
      await select(url, selectBody(name, parsed.paperWidth));
      result = {
        ...parsed,
        selected: name,
        selectedValid: !silent,
        silent,
        silentSelected: silent,
        changed: true,
      };
    }

    if (useCache && (result.silent || result.selectedValid)) {
      mkPrinterCache.set(url, { at: nowFn(), result: { ...result, changed: false } });
    }
    return result;
  })();

  if (useCache) {
    mkPrinterInFlight.set(url, task);
  }
  try {
    return await task;
  } finally {
    if (mkPrinterInFlight.get(url) === task) {
      mkPrinterInFlight.delete(url);
    }
  }
}

import { getPrintersWithFallback, selectPrinter } from './multikassaHttpClient';
import { isDummyMkPrinterName, parseMkFiscalPrinters, pickMkFiscalPrinterToSelect } from './parseMkFiscalPrinters';

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
  const url = String(baseUrl || '').trim();
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

  const { data: raw } = await getList(url);
  const parsed = parseMkFiscalPrinters(raw);
  const name = pickMkFiscalPrinterToSelect(parsed);
  if (!name) {
    return { ...parsed, selected: parsed.selected || '', silent: false, changed: false };
  }
  const silent = isDummyMkPrinterName(name);
  if (parsed.selected === name) {
    return { ...parsed, silent, changed: false };
  }

  await select(url, selectBody(name, parsed.paperWidth));
  return {
    ...parsed,
    selected: name,
    selectedValid: !silent,
    silent,
    silentSelected: silent,
    changed: true,
  };
}

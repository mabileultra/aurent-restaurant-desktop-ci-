import { getPrintersWithFallback, selectPrinter } from './multikassaHttpClient';
import { parseMkFiscalPrinters, pickMkFiscalPrinterToSelect } from './parseMkFiscalPrinters';

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
 * MK Fiscal падает с «принтер не найден», если выбран «(не печатать)» или пусто.
 * Тестовая печать в MK Fiscal при этом может работать.
 */
export async function ensureMkFiscalPrinter(baseUrl, deps = {}) {
  const getList = deps.getPrintersWithFallback || getPrintersWithFallback;
  const select = deps.selectPrinter || selectPrinter;
  const url = String(baseUrl || '').trim();
  if (!url) {
    return { printers: [], labels: [], selected: '', selectedValid: false, changed: false };
  }

  const { data: raw } = await getList(url);
  const parsed = parseMkFiscalPrinters(raw);
  const name = pickMkFiscalPrinterToSelect(parsed);
  if (!name) {
    return { ...parsed, selected: parsed.selected || '', changed: false };
  }
  if (parsed.selectedValid && parsed.selected === name) {
    return { ...parsed, changed: false };
  }

  await select(url, selectBody(name, parsed.paperWidth));
  return {
    ...parsed,
    selected: name,
    selectedValid: true,
    changed: true,
  };
}

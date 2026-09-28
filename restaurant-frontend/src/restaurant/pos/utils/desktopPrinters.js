/** Local Windows printers on the Aurent desktop shell. Browser has none. */

export function isDesktopPrinter() {
  const desk = typeof window !== 'undefined' ? window.desktopCashier : null;
  return Boolean(desk?.isDesktop && typeof desk.printTicketHtml === 'function');
}

export function listDesktopPrinters() {
  return window.desktopCashier.listPrinters();
}

export function getDesktopPrinterSettings() {
  return window.desktopCashier.getPrinterSettings();
}

export function saveDesktopPrinterSettings(settings) {
  return window.desktopCashier.setPrinterSettings(settings);
}

export function printTicketHtml(html, printerName) {
  return window.desktopCashier.printTicketHtml({ html, printerName });
}

const PRINTED_KEY = 'rst-printed-kitchen-lines';

export function readPrintedKitchenLines() {
  try {
    const raw = JSON.parse(localStorage.getItem(PRINTED_KEY) || '[]');
    return new Set(Array.isArray(raw) ? raw.map(String) : []);
  } catch {
    return new Set();
  }
}

export function markPrintedKitchenLines(ids) {
  const set = readPrintedKitchenLines();
  for (const id of ids) {
    if (id != null) set.add(String(id));
  }
  localStorage.setItem(PRINTED_KEY, JSON.stringify([...set].slice(-800)));
}

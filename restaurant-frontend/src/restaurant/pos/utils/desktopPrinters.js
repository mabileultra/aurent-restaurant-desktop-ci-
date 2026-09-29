/** Local Windows printers on the Aurent desktop shell. Browser has none. */

export function isDesktopPrinter() {
  const desk = typeof window !== 'undefined' ? window.desktopCashier : null;
  return Boolean(desk?.isDesktop);
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

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function printTicketHtml(html, printerName) {
  return window.desktopCashier.printTicketHtml({ html, printerName });
}

/**
 * Station and guest tickets. Thermal printers get ESC/POS text.
 * HTML is only a fallback when this desktop build has no ESC/POS channel.
 */
export async function printTicketLines({ title, lines, printerName } = {}) {
  const desk = typeof window !== 'undefined' ? window.desktopCashier : null;
  const name = String(printerName || '').trim();
  if (!name) throw new Error('Принтер не выбран');
  const payload = {
    printerName: name,
    title: title || '',
    lines: (lines || []).map((line) => String(line ?? '')),
    paperWmm: /58/.test(name) ? 58 : 80,
    locale: (typeof document !== 'undefined' && document.documentElement.lang) || 'ru',
  };
  if (typeof desk?.printPlainEscpos === 'function') {
    try {
      return await desk.printPlainEscpos(payload);
    } catch (err) {
      const msg = String(err?.message || err || '');
      const canHtml = typeof desk.printTicketHtml === 'function';
      const missing = /no handler|not implemented|модуль печати не найден/i.test(msg);
      if (!missing || !canHtml) throw err;
    }
  }
  if (typeof desk?.printTicketHtml !== 'function') {
    throw new Error('Печать станции недоступна. Закройте Aurent и откройте заново после обновления.');
  }
  const html = [
    title ? `<p><strong>${escapeHtml(title)}</strong></p>` : '',
    ...payload.lines.map((line) => (line === '---' ? '<hr/>' : `<p>${escapeHtml(line)}</p>`)),
  ].join('');
  return desk.printTicketHtml({ html, printerName: name });
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

/** Local Windows printers on the Aurent desktop shell. Browser has none. */

function printerBridge() {
  if (typeof window === 'undefined') return null;
  const cashier = window.desktopCashier;
  if (cashier?.isDesktop) return cashier;
  const hall = window.aurentRestaurant;
  if (hall?.isDesktop && typeof hall.listPrinters === 'function') return hall;
  return null;
}

export function isDesktopPrinter() {
  const desk = printerBridge();
  return Boolean(desk?.isDesktop || (typeof window !== 'undefined' && window.aurentRestaurant?.isDesktop));
}

export function listDesktopPrinters() {
  const desk = printerBridge();
  if (typeof desk?.listPrinters !== 'function') {
    return Promise.reject(new Error('Список принтеров недоступен в этой сборке'));
  }
  return desk.listPrinters();
}

const PRINTER_LIST_TTL_MS = 60_000;
let printerListCache = { at: 0, list: null, pending: null };

/** Cached Windows printer list — avoids IPC on every kitchen/category slip. */
export async function listDesktopPrintersCached() {
  const now = Date.now();
  if (printerListCache.list && now - printerListCache.at < PRINTER_LIST_TTL_MS) {
    return printerListCache.list;
  }
  if (printerListCache.pending) return printerListCache.pending;
  printerListCache.pending = Promise.resolve(listDesktopPrinters())
    .then((list) => {
      const next = Array.isArray(list) ? list : [];
      printerListCache = { at: Date.now(), list: next, pending: null };
      return next;
    })
    .catch((err) => {
      printerListCache.pending = null;
      throw err;
    });
  return printerListCache.pending;
}

export function getDesktopPrinterSettings() {
  const desk = printerBridge();
  if (typeof desk?.getPrinterSettings !== 'function') {
    return Promise.resolve({
      receiptPrinterName: '',
      labelPrinterName: '',
      labelPrinterMode: 'driver',
      billPrinterName: '',
      stationPrinters: {},
    });
  }
  return desk.getPrinterSettings();
}

export function saveDesktopPrinterSettings(settings) {
  const desk = printerBridge();
  if (typeof desk?.setPrinterSettings !== 'function') {
    return Promise.reject(new Error('Сохранение принтеров недоступно в этой сборке'));
  }
  return desk.setPrinterSettings(settings);
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function printRawLabel(printerName, bytes) {
  const desk = printerBridge();
  if (typeof desk?.printRaw !== 'function') {
    return Promise.reject(new Error('TSPL недоступен в этой сборке'));
  }
  return desk.printRaw({ printerName, bytes });
}

export function printTicketHtml(html, printerName) {
  const desk = printerBridge();
  if (typeof desk?.printTicketHtml !== 'function') {
    return Promise.reject(new Error('Печать недоступна в этой сборке'));
  }
  return desk.printTicketHtml({ html, printerName });
}

/**
 * Station and guest tickets. Thermal printers get ESC/POS text.
 * HTML is only a fallback when this desktop build has no ESC/POS channel.
 */
const PRINT_TIMEOUT_MS = 12_000;

function withPrintTimeout(promise, label = 'печать') {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = window.setTimeout(() => {
      reject(new Error(`Таймаут ${label} (${PRINT_TIMEOUT_MS / 1000}с)`));
    }, PRINT_TIMEOUT_MS);
  });
  return Promise.race([promise, timeout]).finally(() => {
    if (timer != null) window.clearTimeout(timer);
  });
}

/**
 * One slip at a time per printer: parallel RAW jobs spawn a PowerShell each and
 * starve the PC, so they hit the timeout and get re-queued. Different printers still run in parallel.
 * The print timeout starts only when the slip leaves the lane.
 */
const printerLanes = new Map();

function runOnPrinterLane(printerName, task) {
  const key = printerName.toLowerCase();
  const run = (printerLanes.get(key) || Promise.resolve()).then(task);
  const tail = run.catch(() => {});
  printerLanes.set(key, tail);
  tail.then(() => {
    if (printerLanes.get(key) === tail) printerLanes.delete(key);
  });
  return run;
}

export async function printTicketLines({
  title,
  lines,
  printerName,
  fontFamily,
  logoDataUrl,
  logoMaxHeightMm,
  titleEmph,
} = {}) {
  const name = String(printerName || '').trim();
  if (!name) throw new Error('Принтер не выбран');
  return runOnPrinterLane(name, () => printTicketLinesNow({
    title,
    lines,
    name,
    fontFamily,
    logoDataUrl,
    logoMaxHeightMm,
    titleEmph,
  }));
}

async function printTicketLinesNow({
  title,
  lines,
  name,
  fontFamily,
  logoDataUrl,
  logoMaxHeightMm,
  titleEmph,
}) {
  const desk = printerBridge();
  const payload = {
    printerName: name,
    title: title || '',
    lines: (lines || []).map((line) => String(line ?? '')),
    paperWmm: /58/.test(name) ? 58 : 80,
    locale: (typeof document !== 'undefined' && document.documentElement.lang) || 'ru',
    logoDataUrl: logoDataUrl || '',
    logoMaxHeightMm: Number(logoMaxHeightMm) || 12,
    titleEmph: Boolean(titleEmph) || /отказ|void|bekor/i.test(String(title || '')),
  };
  if (typeof desk?.printPlainEscpos === 'function') {
    try {
      return await withPrintTimeout(desk.printPlainEscpos(payload), 'ESC/POS');
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
  const refuseTitle = payload.titleEmph;
  const titleStyle = refuseTitle
    ? 'margin:0 0 10px;text-align:center;font-weight:900;font-size:22px;letter-spacing:0.08em'
    : 'margin:0 0 8px;text-align:center;font-weight:700';
  const family = fontFamily || 'ui-monospace, Menlo, Consolas, monospace';
  const logoHtml = payload.logoDataUrl
    ? `<div style="text-align:center;margin:0 0 8px"><img src="${payload.logoDataUrl.replace(/"/g, '')}" alt="" style="max-height:${payload.logoMaxHeightMm}mm;max-width:100%;object-fit:contain"/></div>`
    : '';
  const html = [
    `<div style="font-family:${family};font-size:13px;font-weight:400;line-height:1.35">`,
    logoHtml,
    title ? `<p style="${titleStyle}">${escapeHtml(title)}</p>` : '',
    ...payload.lines.map((line) => {
      if (line === '---') {
        return '<hr style="border:none;border-top:1px dashed #000;margin:6px 0"/>';
      }
      const raw = String(line);
      const emph = raw.startsWith('§E§');
      const boldOnly = !emph && raw.startsWith('§B§');
      const text = emph || boldOnly ? raw.slice(3) : raw;
      const style = emph
        ? 'white-space:pre;margin:0;font-weight:800;font-size:17px'
        : boldOnly
          ? 'white-space:pre;margin:0;font-weight:700;font-size:14px'
          : 'white-space:pre;margin:0';
      return `<p style="${style}">${escapeHtml(text)}</p>`;
    }),
    '</div>',
  ].join('');
  return withPrintTimeout(desk.printTicketHtml({ html, printerName: name }), 'HTML-печати');
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

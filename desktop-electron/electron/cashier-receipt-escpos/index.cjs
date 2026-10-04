/**
 * ESC/POS: чеки, Z/X-отчёты, этикетки (main process).
 */
const { ESCPOS_ERROR_CODES, EscposPrintError } = require('./escpos-errors.cjs');
const { runEscposPrintJob } = require('./escpos-job.cjs');
const { validatePayload, buildReceiptOnPrinter } = require('./escpos-sale-builder.cjs');
const { validateZReportPayload, buildZReportOnPrinter } = require('./escpos-z-report-builder.cjs');
const {
  validateShiftReportPayload,
  buildShiftReportOnPrinter,
} = require('./escpos-shift-report-builder.cjs');
const { validateLabelPayload, buildLabelsOnPrinter } = require('./escpos-label-builder.cjs');
const { createReceiptPrinter, createLabelPrinter } = require('./escpos-printer-service.cjs');
const {
  normalizeLocale,
  normalizePrintText,
  preparePrinterEncoding,
  payloadContainsCyrillic,
} = require('./escpos-encoding.cjs');
const { listSystemPrinters } = require('../printers/resolve.cjs');
const { matchPrinterName } = require('../printers/printer-match.cjs');

function wrapEscposError(err) {
  if (err instanceof EscposPrintError) {
    const e = new Error(err.message);
    e.code = err.code;
    e.step = err.step;
    throw e;
  }
  throw err;
}

async function printSaleReceiptEscpos(payload, deps) {
  try {
    return await runEscposPrintJob({
      jobType: 'sale_receipt',
      payload,
      resolvePrinterName: deps.resolveReceiptPrinterName,
      validatePayload,
      createPrinter: (deviceName, p) =>
        createReceiptPrinter(deviceName, { locale: p.locale, paperWmm: p.paperWmm }),
      buildOnPrinter: (printer, p, jobId) => buildReceiptOnPrinter(printer, p, jobId),
      noPrinterHint: 'Принтер чека не настроен. Aurent → «Принтер чека».',
    });
  } catch (err) {
    wrapEscposError(err);
  }
}

async function printZReportEscpos(payload, deps) {
  try {
    return await runEscposPrintJob({
      jobType: 'z_report',
      payload,
      resolvePrinterName: deps.resolveReceiptPrinterName,
      validatePayload: validateZReportPayload,
      createPrinter: (deviceName, p) => createReceiptPrinter(deviceName, { locale: p.locale }),
      buildOnPrinter: (printer, p) => buildZReportOnPrinter(printer, p),
      noPrinterHint: 'Принтер чека не настроен. Aurent → «Принтер чека».',
    });
  } catch (err) {
    wrapEscposError(err);
  }
}

async function printShiftReportEscpos(payload, deps) {
  try {
    return await runEscposPrintJob({
      jobType: 'shift_report',
      payload,
      resolvePrinterName: deps.resolveReceiptPrinterName,
      validatePayload: validateShiftReportPayload,
      createPrinter: (deviceName, p) => createReceiptPrinter(deviceName, { locale: p.locale }),
      buildOnPrinter: (printer, p) => buildShiftReportOnPrinter(printer, p),
      noPrinterHint: 'Принтер чека не настроен. Aurent → «Принтер чека».',
    });
  } catch (err) {
    wrapEscposError(err);
  }
}

async function printLabelsEscpos(payload, deps) {
  try {
    return await runEscposPrintJob({
      jobType: 'label',
      payload,
      resolvePrinterName: deps.resolveLabelPrinterName,
      validatePayload: validateLabelPayload,
      createPrinter: (deviceName, p) =>
        createLabelPrinter(deviceName, { locale: p.locale, paperWmm: p.paperWmm }),
      buildOnPrinter: (printer, p) => buildLabelsOnPrinter(printer, p),
      noPrinterHint:
        'Принтер этикеток не выбран. Aurent → «Принтер штрих-кодов» — выберите устройство.',
    });
  } catch (err) {
    wrapEscposError(err);
  }
}

function paperMmForPrinter(name, explicit) {
  const given = Number(explicit);
  if (given >= 40 && given <= 120) return given;
  return /58/.test(String(name || '')) ? 58 : 80;
}

function validatePlainTicket(payload) {
  if (!String(payload?.printerName || '').trim()) {
    throw new Error('Принтер станции не выбран');
  }
  if (!Array.isArray(payload?.lines) || payload.lines.length === 0) {
    throw new Error('Пустой чек');
  }
}

/**
 * Кухонный чек и счёт гостю: RAW ESC/POS на выбранный принтер, не HTML-страница.
 * Xprinter: обязательно выход из китайского режима + code page (как у фискального чека).
 * @param {object} payload
 */
async function printPlainTicketEscpos(payload) {
  const requested = String(payload?.printerName || '').trim();
  const locale = normalizeLocale(payload?.locale);
  const hasCyrillic = payloadContainsCyrillic({
    title: payload?.title,
    lines: payload?.lines,
  });
  const safePayload = {
    ...payload,
    locale,
    title: normalizePrintText(payload?.title || '', locale),
    lines: (payload?.lines || []).map((line) => normalizePrintText(line, locale)),
  };
  try {
    return await runEscposPrintJob({
      jobType: 'plain_ticket',
      payload: safePayload,
      resolvePrinterName: async () => {
        const printers = await listSystemPrinters();
        return matchPrinterName(requested, printers) || requested;
      },
      validatePayload: validatePlainTicket,
      createPrinter: (deviceName, p) =>
        createReceiptPrinter(deviceName, {
          locale: p.locale || 'ru',
          paperWmm: paperMmForPrinter(deviceName, p.paperWmm),
          payloadHasCyrillic: hasCyrillic && locale !== 'uz',
        }),
      buildOnPrinter: (printer, p) => {
        preparePrinterEncoding(printer, p.locale);
        const width = typeof printer.getWidth === 'function' ? Number(printer.getWidth()) || 32 : 32;
        // Kitchen / category / cancel: one normal Font A size for every line (no double-height).
        if (typeof printer.setTypeFontA === 'function') printer.setTypeFontA();
        if (typeof printer.setTextNormal === 'function') printer.setTextNormal();
        printer.bold(false);
        const wrap = (text) => {
          const src = String(text || '').replace(/\s+/g, ' ').trim();
          if (!src) return [];
          if (src.length <= width) return [src];
          const out = [];
          let rest = src;
          while (rest.length > width) {
            let cut = rest.lastIndexOf(' ', width);
            if (cut < 8) cut = width;
            out.push(rest.slice(0, cut).trimEnd());
            rest = rest.slice(cut).trimStart();
          }
          if (rest) out.push(rest);
          return out;
        };
        // Frontend padRow ("Name····×2") — leftRight pins qty to the edge.
        const splitPaddedRow = (text) => {
          const m = String(text || '').match(/^(\S.*?)\s{2,}(\S.*)$/);
          if (!m) return null;
          return { left: m[1].trimEnd(), right: m[2].trim() };
        };
        if (p.title) {
          printer.alignCenter();
          wrap(p.title).forEach((line) => printer.println(line));
          printer.newLine();
          printer.alignLeft();
        }
        for (const raw of p.lines) {
          const text = String(raw ?? '');
          if (!text) {
            printer.newLine();
            continue;
          }
          if (text === '---') {
            printer.drawLine();
            continue;
          }
          if (text.startsWith('≫ ') || text.startsWith('>> ')) {
            wrap(text.replace(/^≫ |^>> /, '')).forEach((line) => printer.println(line));
            continue;
          }
          const padded = splitPaddedRow(text);
          if (padded && typeof printer.leftRight === 'function'
            && padded.left.length + padded.right.length < width) {
            printer.leftRight(padded.left, padded.right);
            continue;
          }
          wrap(text).forEach((line) => printer.println(line));
        }
        printer.newLine();
        printer.cut();
      },
      noPrinterHint: 'Принтер станции не выбран.',
    });
  } catch (err) {
    wrapEscposError(err);
  }
}

function registerEscposIpcHandler(ipcMain, channel, handler) {
  ipcMain.handle(channel, async (_event, payload) => {
    try {
      return await handler(payload);
    } catch (err) {
      wrapEscposError(err);
    }
  });
}

/**
 * @param {import('electron').IpcMain} ipcMain
 * @param {{ resolveReceiptPrinterName: Function, resolveLabelPrinterName: Function }} deps
 */
function registerEscposIpcHandlers(ipcMain, deps) {
  registerEscposIpcHandler(ipcMain, 'desktop:print-receipt-escpos', (payload) =>
    printSaleReceiptEscpos(payload, deps),
  );
  registerEscposIpcHandler(ipcMain, 'desktop:print-z-report-escpos', (payload) =>
    printZReportEscpos(payload, deps),
  );
  registerEscposIpcHandler(ipcMain, 'desktop:print-shift-report-escpos', (payload) =>
    printShiftReportEscpos(payload, deps),
  );
  registerEscposIpcHandler(ipcMain, 'desktop:print-label-escpos', (payload) =>
    printLabelsEscpos(payload, deps),
  );
  registerEscposIpcHandler(ipcMain, 'desktop:print-plain-escpos', (payload) =>
    printPlainTicketEscpos(payload),
  );
}

module.exports = {
  printSaleReceiptEscpos,
  printZReportEscpos,
  printShiftReportEscpos,
  printLabelsEscpos,
  printPlainTicketEscpos,
  registerEscposIpcHandlers,
  EscposPrintError,
  ESCPOS_ERROR_CODES,
};

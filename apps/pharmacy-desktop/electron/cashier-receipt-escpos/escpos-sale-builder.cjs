/**
 * Сборка команд чека на экземпляре ThermalPrinter.
 * Подписи полей приходят с фронта (labels), без i18n в main.
 */
const fs = require('fs');
const { logWarn } = require('./escpos-log.cjs');
const { writeLogoPngTempFile } = require('./escpos-logo-file.cjs');
const { sanitizePayloadForPrint, preparePrinterEncoding } = require('./escpos-encoding.cjs');
const { beepAndCut } = require('./escpos-layout.cjs');
const { withFieldStyle } = require('./escpos-field-style.cjs');
const { isOn, appendDivider } = require('./escpos-sale-layout.cjs');
const {
  appendMeta,
  appendReceiptType,
  appendItems,
  appendTotals,
  appendPayment,
  appendFiscalBlock,
  appendProfileFooter,
} = require('./escpos-sale-body.cjs');

async function writeLogoTempFile(dataUrl, jobId, maxHeightMm) {
  return writeLogoPngTempFile(dataUrl, `aurent-receipt-logo-${jobId}`, { maxHeightMm });
}

/**
 * Шапка: логотип, название, адрес, телефон, СТИР.
 */
async function appendHeader(printer, payload, jobId) {
  const { sale, branding, receiptFields, labels } = payload;
  const fields = receiptFields || {};
  const L = labels || {};

  const phone = String(branding?.companyPhone || '').trim();
  const stir = String(branding?.stir || '').trim();
  const showHeader =
    isOn(fields, 'logo') ||
    isOn(fields, 'companyName') ||
    (isOn(fields, 'companyAddress') && branding?.companyAddress) ||
    (isOn(fields, 'companyPhone') && phone) ||
    (isOn(fields, 'stir') && stir) ||
    phone ||
    stir;

  if (!showHeader) return;

  printer.alignCenter();

  if (isOn(fields, 'logo') && branding?.logoDataUrl) {
    try {
      const imgPath = await writeLogoTempFile(
        branding.logoDataUrl,
        jobId,
        branding.logoMaxHeightMm,
      );
      if (imgPath) {
        await printer.printImage(imgPath);
        printer.newLine();
        try {
          fs.unlinkSync(imgPath);
        } catch {
          /* ignore */
        }
      }
    } catch (err) {
      logWarn(jobId, 'LOGO_SKIP', { message: err?.message });
    }
  }

  const styles = payload.receiptFieldStyles;
  const companyName = branding?.companyName || sale?.storeName || '';
  if (isOn(fields, 'companyName') && companyName) {
    withFieldStyle(printer, styles, 'companyName', () => {
      printer.println(String(companyName).toUpperCase());
    });
  }
  if (isOn(fields, 'companyAddress') && branding?.companyAddress) {
    withFieldStyle(printer, styles, 'companyAddress', () => {
      printer.println(String(branding.companyAddress));
    });
  }
  if (phone && isOn(fields, 'companyPhone')) {
    withFieldStyle(printer, styles, 'companyPhone', () => {
      printer.println(`${L.phoneLabel || 'Tel'}: ${phone}`);
    });
  }
  if (stir && isOn(fields, 'stir')) {
    withFieldStyle(printer, styles, 'stir', () => {
      printer.println(`${L.stir || 'STIR'}: ${stir}`);
    });
  }
  printer.alignLeft();
  appendDivider(printer);
}

/**
 * QR Multikassa (ofd.soliq.uz).
 */
async function appendQrAndFooter(printer, payload, jobId) {
  const { sale, receiptFields, qrValue: payloadQr } = payload;
  const fields = receiptFields || {};

  if (!isOn(fields, 'qrCode') || sale?.printFiscalQr === false) return;

  const qrValue = String(payloadQr || sale?.fiscalQrUrl || '').trim();
  const isTaxQr =
    /ofd\.soliq\.uz\/(check|epi)\?/i.test(qrValue) && /[?&]t=/i.test(qrValue) && /[?&]s=/i.test(qrValue);
  if (!isTaxQr) return;

  printer.alignCenter();

  let printedImage = false;
  const dataUrl = String(payload.qrImageDataUrl || '').trim();
  const paperMm = Number(payload.paperWmm) || 80;
  if (dataUrl) {
    try {
      const imgPath = await writeLogoTempFile(dataUrl, `${jobId}-qr`, paperMm <= 58 ? 32 : 42);
      if (imgPath) {
        await printer.printImage(imgPath);
        printedImage = true;
        try {
          fs.unlinkSync(imgPath);
        } catch {
          /* ignore */
        }
      }
    } catch (err) {
      logWarn(jobId, 'QR_IMAGE_SKIP', { message: err?.message });
    }
  }
  if (!printedImage) {
    try {
      printer.printQR(qrValue, { cellSize: paperMm <= 58 ? 8 : 10, correction: 'M', model: 2 });
    } catch (err) {
      logWarn(jobId, 'QR_SKIP', { message: err?.message, len: qrValue.length });
    }
  }
  printer.alignLeft();
}

async function buildReceiptOnPrinter(printer, payload, jobId) {
  const safePayload = sanitizePayloadForPrint(payload);
  printer.clear();
  preparePrinterEncoding(printer, safePayload.locale);
  await appendHeader(printer, safePayload, jobId);
  appendMeta(printer, safePayload);
  if (isOn(safePayload.receiptFields, 'items')) {
    appendDivider(printer);
  }
  appendItems(printer, safePayload);
  appendTotals(printer, safePayload);
  appendPayment(printer, safePayload);
  appendReceiptType(printer, safePayload);
  appendFiscalBlock(printer, safePayload);
  await appendQrAndFooter(printer, safePayload, jobId);
  appendProfileFooter(printer, safePayload);
  beepAndCut(printer);
}

function validatePayload(payload) {
  const sale = payload?.sale;
  if (!sale || typeof sale !== 'object') {
    throw new Error('Нет данных продажи (sale)');
  }
  const textLen = JSON.stringify(sale).length;
  if (!sale.receiptNumber || textLen < 40) {
    throw new Error('Неполные данные чека');
  }
}

module.exports = {
  appendHeader,
  appendMeta,
  appendReceiptType,
  appendItems,
  appendTotals,
  appendPayment,
  appendFiscalBlock,
  appendQrAndFooter,
  buildReceiptOnPrinter,
  validatePayload,
};

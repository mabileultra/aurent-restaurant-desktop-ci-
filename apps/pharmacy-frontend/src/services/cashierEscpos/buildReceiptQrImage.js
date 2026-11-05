import QRCode from 'qrcode';

/**
 * Крупный QR на бланке ОФД: 42 мм на 80-мм ленте, 32 мм на 58 мм. На экране чека тоже крупнее.
 * @param {number} paperWmm
 * @returns {number}
 */
export function receiptQrPixelSize(paperWmm) {
  const mm = Number(paperWmm) || 80;
  if (mm <= 58) return 256;
  return 336;
}

/**
 * PNG data URL крупного налогового QR — ESC/POS печатает картинкой, не мелкой командой printQR.
 * @param {string} value
 * @param {number} [paperWmm]
 * @returns {Promise<string>}
 */
export async function buildReceiptQrImageDataUrl(value, paperWmm = 80) {
  const text = String(value || '').trim();
  if (!text) return '';
  return QRCode.toDataURL(text, {
    width: receiptQrPixelSize(paperWmm),
    margin: 1,
    errorCorrectionLevel: 'M',
    color: { dark: '#000000', light: '#FFFFFF' },
  });
}

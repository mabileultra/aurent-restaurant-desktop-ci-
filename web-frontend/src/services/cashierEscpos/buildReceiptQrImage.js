import QRCode from 'qrcode';

/**
 * Чуть меньше QR на бланке ОФД (~32–36 мм): 28 мм на 80-мм ленте, 22 мм на 58 мм.
 * @param {number} paperWmm
 * @returns {number}
 */
export function receiptQrPixelSize(paperWmm) {
  const mm = Number(paperWmm) || 80;
  if (mm <= 58) return 176;
  return 224;
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

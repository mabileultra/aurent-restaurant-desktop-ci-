import { readImageDataUrl } from './readImageDataUrl';

/** ~80mm @ 203dpi; keeps ESC/POS raster small and under API logo limit. */
const MAX_WIDTH_PX = 384;
const MAX_HEIGHT_PX = 160;
/** Backend StorePrintProfileServiceImpl.MAX_LOGO_CHARS = 400_000 */
const MAX_DATA_URL_CHARS = 350_000;

/**
 * Read an image file as a compact PNG data URL for receipt logos.
 * Thermal ESC/POS printImage needs real PNG bytes; oversized data URLs fail save.
 *
 * @param {File} file
 * @param {number} [maxBytes] source file size cap
 * @returns {Promise<string>}
 */
export async function readImageAsPngDataUrl(file, maxBytes = 350 * 1024) {
  const dataUrl = await readImageDataUrl(file, maxBytes);
  if (typeof Image === 'undefined' || typeof document === 'undefined') {
    if (dataUrl.length > MAX_DATA_URL_CHARS) throw new Error('TOO_LARGE');
    return dataUrl;
  }

  const img = await loadImage(dataUrl);
  let width = img.naturalWidth || img.width;
  let height = img.naturalHeight || img.height;
  if (!width || !height) throw new Error('READ_FAILED');

  const scale = Math.min(1, MAX_WIDTH_PX / width, MAX_HEIGHT_PX / height);
  width = Math.max(1, Math.round(width * scale));
  height = Math.max(1, Math.round(height * scale));

  for (let attempt = 0; attempt < 6; attempt += 1) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('READ_FAILED');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);
    const out = canvas.toDataURL('image/png');
    if (out.length <= MAX_DATA_URL_CHARS) return out;
    width = Math.max(48, Math.round(width * 0.7));
    height = Math.max(24, Math.round(height * 0.7));
  }
  throw new Error('TOO_LARGE');
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('READ_FAILED'));
    img.src = src;
  });
}

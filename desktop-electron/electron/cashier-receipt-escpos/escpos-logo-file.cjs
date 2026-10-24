/**
 * Persist a receipt logo data URL as a crisp PNG for thermal printImage.
 * Size follows logoMaxHeightMm; light threshold to B&W without fattening strokes.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { nativeImage } = require('electron');

/** 80mm paper @ ~203 dpi */
const PAPER_WIDTH_PX = 384;
/** ~8 dots per mm @ 203 dpi */
const DOTS_PER_MM = 8;
/**
 * Greyscale below this → black.
 * Mid threshold keeps thin lines; high values (180+) + dilate made logos fat/blurry.
 */
const INK_THRESHOLD = 140;

/**
 * @param {string} dataUrl
 * @param {string} fileStem unique name fragment
 * @param {{ maxHeightMm?: number }} [opts]
 * @returns {string|null} absolute PNG path
 */
function writeLogoPngTempFile(dataUrl, fileStem, opts = {}) {
  const raw = String(dataUrl || '').trim();
  if (!raw.startsWith('data:image/')) return null;

  let img = nativeImage.createFromDataURL(raw);
  if (!img || img.isEmpty()) {
    const m = raw.match(/^data:image\/[\w+.-]+;base64,(.+)$/i);
    if (!m) return null;
    img = nativeImage.createFromBuffer(Buffer.from(m[1], 'base64'));
  }
  if (!img || img.isEmpty()) return null;

  const maxHeightMm = clamp(Number(opts.maxHeightMm) || 20, 8, 48);
  const maxH = Math.round(maxHeightMm * DOTS_PER_MM);
  const maxW = PAPER_WIDTH_PX;

  const size = img.getSize();
  let width = size.width || 1;
  let height = size.height || 1;
  // Never upscale — stretching softens edges on thermal. Only shrink to fit.
  const scale = Math.min(1, maxW / width, maxH / height);
  if (scale < 1) {
    width = Math.max(1, Math.round(width * scale));
    height = Math.max(1, Math.round(height * scale));
    img = img.resize({ width, height, quality: 'better' });
  }

  img = toCrispThermalBitmap(img);

  const filePath = path.join(os.tmpdir(), `${fileStem}.png`);
  fs.writeFileSync(filePath, img.toPNG());
  return filePath;
}

/**
 * Clean black/white without dilate — sharp strokes, not a fat blob.
 * @param {Electron.NativeImage} img
 */
function toCrispThermalBitmap(img) {
  const { width, height } = img.getSize();
  if (!width || !height) return img;
  const src = img.toBitmap();
  const stride = width * 4;
  if (src.length < stride * height) return img;

  const out = Buffer.alloc(src.length);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = y * stride + x * 4;
      const b = src[i];
      const g = src[i + 1];
      const r = src[i + 2];
      const a = src[i + 3];
      let v = 255;
      if (a >= 32) {
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        v = lum < INK_THRESHOLD ? 0 : 255;
      }
      out[i] = v;
      out[i + 1] = v;
      out[i + 2] = v;
      out[i + 3] = 255;
    }
  }
  return nativeImage.createFromBitmap(out, { width, height });
}

function clamp(n, min, max) {
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, n));
}

module.exports = { writeLogoPngTempFile };

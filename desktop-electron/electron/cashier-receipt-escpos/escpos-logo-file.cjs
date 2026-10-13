/**
 * Persist a receipt logo data URL as a high-contrast PNG for thermal printImage.
 * Size follows logoMaxHeightMm; pixels are thresholded so logos print dark, not grey dither.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { nativeImage } = require('electron');

/** 80mm paper @ ~203 dpi */
const PAPER_WIDTH_PX = 384;
/** ~8 dots per mm @ 203 dpi */
const DOTS_PER_MM = 8;
/** Greyscale below this → black (higher = bolder / darker logo). */
const BOLD_THRESHOLD = 185;

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

  const maxHeightMm = clamp(Number(opts.maxHeightMm) || 20, 8, 40);
  const maxH = Math.round(maxHeightMm * DOTS_PER_MM);
  const maxW = PAPER_WIDTH_PX;

  const size = img.getSize();
  let width = size.width || 1;
  let height = size.height || 1;
  // Fit into paper width × requested mm height (upscale small logos).
  const scale = Math.min(maxW / width, maxH / height);
  width = Math.max(1, Math.round(width * scale));
  height = Math.max(1, Math.round(height * scale));
  if (width !== size.width || height !== size.height) {
    img = img.resize({ width, height, quality: 'better' });
  }

  img = toBoldThermalBitmap(img);

  const filePath = path.join(os.tmpdir(), `${fileStem}.png`);
  fs.writeFileSync(filePath, img.toPNG());
  return filePath;
}

/**
 * Hard black/white + 1px thicken so thin logo strokes survive ESC/POS dither.
 * @param {Electron.NativeImage} img
 */
function toBoldThermalBitmap(img) {
  const { width, height } = img.getSize();
  if (!width || !height) return img;
  const src = img.toBitmap();
  // Electron bitmap is BGRA, 4 bytes/pixel.
  const stride = width * 4;
  if (src.length < stride * height) return img;

  const mask = Buffer.alloc(width * height); // 1 = black
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = y * stride + x * 4;
      const b = src[i];
      const g = src[i + 1];
      const r = src[i + 2];
      const a = src[i + 3];
      if (a < 32) {
        mask[y * width + x] = 0;
        continue;
      }
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      mask[y * width + x] = lum < BOLD_THRESHOLD ? 1 : 0;
    }
  }

  // Dilate once — thicken strokes for thermal.
  const bold = Buffer.from(mask);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (mask[y * width + x]) continue;
      let neighbor = false;
      for (let dy = -1; dy <= 1 && !neighbor; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          if (!dx && !dy) continue;
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
          if (mask[ny * width + nx]) {
            neighbor = true;
            break;
          }
        }
      }
      if (neighbor) bold[y * width + x] = 1;
    }
  }

  const out = Buffer.alloc(src.length);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = y * stride + x * 4;
      const black = bold[y * width + x];
      const v = black ? 0 : 255;
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

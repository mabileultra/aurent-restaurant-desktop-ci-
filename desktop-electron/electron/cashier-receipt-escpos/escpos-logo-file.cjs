/**
 * Persist a receipt logo data URL as a real PNG for node-thermal-printer printImage.
 * JPEG/WebP bytes with a .png extension fail silently — nativeImage re-encodes.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { nativeImage } = require('electron');

const MAX_WIDTH_PX = 384;

/**
 * @param {string} dataUrl
 * @param {string} fileStem unique name fragment
 * @returns {string|null} absolute PNG path
 */
function writeLogoPngTempFile(dataUrl, fileStem) {
  const raw = String(dataUrl || '').trim();
  if (!raw.startsWith('data:image/')) return null;

  let img = nativeImage.createFromDataURL(raw);
  if (!img || img.isEmpty()) {
    // Fallback: strip header and try buffer (some payloads omit charset quirks).
    const m = raw.match(/^data:image\/[\w+.-]+;base64,(.+)$/i);
    if (!m) return null;
    img = nativeImage.createFromBuffer(Buffer.from(m[1], 'base64'));
  }
  if (!img || img.isEmpty()) return null;

  const size = img.getSize();
  if (size.width > MAX_WIDTH_PX) {
    img = img.resize({ width: MAX_WIDTH_PX, quality: 'better' });
  }

  const filePath = path.join(os.tmpdir(), `${fileStem}.png`);
  fs.writeFileSync(filePath, img.toPNG());
  return filePath;
}

module.exports = { writeLogoPngTempFile };

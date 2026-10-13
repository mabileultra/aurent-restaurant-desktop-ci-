import { readImageDataUrl } from './readImageDataUrl';

/**
 * Read an image file as a PNG data URL (thermal ESC/POS printImage needs PNG bytes).
 * @param {File} file
 * @param {number} [maxBytes]
 * @returns {Promise<string>}
 */
export async function readImageAsPngDataUrl(file, maxBytes = 350 * 1024) {
  const dataUrl = await readImageDataUrl(file, maxBytes);
  if (dataUrl.startsWith('data:image/png')) return dataUrl;
  if (typeof Image === 'undefined' || typeof document === 'undefined') return dataUrl;

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        if (!canvas.width || !canvas.height) {
          reject(new Error('READ_FAILED'));
          return;
        }
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('READ_FAILED'));
          return;
        }
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } catch {
        reject(new Error('READ_FAILED'));
      }
    };
    img.onerror = () => reject(new Error('READ_FAILED'));
    img.src = dataUrl;
  });
}

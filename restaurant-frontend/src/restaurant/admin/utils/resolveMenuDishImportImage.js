import { rstMenuApi } from '../../api/menu.api';
import { isDirectMenuImageUrl, parseMenuImageItemId } from '../../shared/utils/menuImageRef';

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('READ_FAILED'));
    reader.readAsDataURL(blob);
  });
}

/**
 * Excel stores photo as http(s) link or aurent-menu-img:{id} (from export).
 * Convert refs to data URL before create/update so the new card keeps the photo.
 */
export async function resolveMenuDishImportImage(imageUrl) {
  const raw = String(imageUrl || '').trim();
  if (!raw) return null;

  if (raw.startsWith('data:')) return raw;
  if (isDirectMenuImageUrl(raw) && (raw.startsWith('http://') || raw.startsWith('https://'))) {
    return raw;
  }

  const itemId = parseMenuImageItemId(raw);
  if (!itemId) return raw;

  try {
    const blob = await rstMenuApi.getImageBlob(itemId);
    if (!blob || !blob.size) return null;
    return await blobToDataUrl(blob);
  } catch {
    return null;
  }
}

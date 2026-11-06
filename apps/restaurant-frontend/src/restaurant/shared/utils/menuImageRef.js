/** Must match backend MenuItemImageRef.PREFIX */
export const MENU_IMAGE_REF_PREFIX = 'aurent-menu-img:';

export function parseMenuImageItemId(imageUrl) {
  if (!imageUrl || typeof imageUrl !== 'string') return null;
  if (!imageUrl.startsWith(MENU_IMAGE_REF_PREFIX)) return null;
  const id = imageUrl.slice(MENU_IMAGE_REF_PREFIX.length).trim();
  return id || null;
}

export function isDirectMenuImageUrl(imageUrl) {
  if (!imageUrl || typeof imageUrl !== 'string') return false;
  const v = imageUrl.trim();
  return v.startsWith('http://')
    || v.startsWith('https://')
    || v.startsWith('data:');
}

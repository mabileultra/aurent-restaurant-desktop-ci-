/** Stable 1..8 tint from a label (category name preferred). */
export function categoryTone(name) {
  const s = String(name || '').trim().toLowerCase();
  if (!s) return 0;
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (h * 33 + s.charCodeAt(i)) >>> 0;
  return (h % 8) + 1;
}

/** menuItemId → category label for ticket line colors. */
export function buildCategoryByMenuId(menuItems) {
  const map = {};
  for (const item of menuItems || []) {
    if (item?.id == null) continue;
    const label = String(item.category || item.menuCategoryName || '').trim();
    map[String(item.id)] = label;
    map[item.id] = label;
  }
  return map;
}

/**
 * Resolve tint key: category from menu map, else dish name so lines still differ.
 */
export function resolveOrderLineToneKey(line, categoryByMenuId) {
  const fromMap = categoryByMenuId?.[line?.menuItemId]
    || categoryByMenuId?.[String(line?.menuItemId)]
    || '';
  if (fromMap) return fromMap;
  return String(
    line?.category
    || line?.menuItemName
    || line?.name
    || line?.menuItemId
    || '',
  ).trim();
}

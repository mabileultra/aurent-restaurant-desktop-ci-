import { familyPunchScore, readMenuPunchMap } from './menuPunchFrequency';
import { readMenuFavorites } from './menuFavorites';
import { groupMenuFamilies } from '../components/MenuVariantPickModal';

export const MENU_LIST_FILTERS = ['all', 'favorites', 'recent', 'discounts'];

function parseTags(raw) {
  if (!raw) return [];
  return String(raw)
    .split(/[,;|\s]+/)
    .map((part) => part.trim().toUpperCase())
    .filter(Boolean);
}

export function hasHitTag(item) {
  return parseTags(item?.tags).includes('HIT');
}

export function familyInCheck(family, qtyByMenuId) {
  return family.variants.reduce((sum, item) => sum + (qtyByMenuId[item.id] || 0), 0);
}

export function familyImageUrl(family) {
  return family.variants.find((variant) => variant.imageUrl)?.imageUrl || '';
}

export function familyCategoryName(family, uncategorizedLabel) {
  return family.primary?.category || uncategorizedLabel;
}

export function buildCategoryTiles(items, catalogCategories, uncategorizedLabel) {
  const families = groupMenuFamilies(items || []);
  const counts = new Map();
  const fallbackImage = new Map();
  for (const family of families) {
    const name = familyCategoryName(family, uncategorizedLabel);
    counts.set(name, (counts.get(name) || 0) + 1);
    if (!fallbackImage.get(name)) {
      const image = familyImageUrl(family);
      if (image) fallbackImage.set(name, image);
    }
  }

  const tiles = (catalogCategories || [])
    .filter((row) => row.active !== false)
    .map((row) => ({
      key: row.name,
      name: row.name,
      count: counts.get(row.name) || 0,
      imageUrl: row.imageUrl || fallbackImage.get(row.name) || '',
      sortOrder: row.sortOrder ?? 100,
    }))
    .filter((tile) => tile.count > 0);

  const named = new Set(tiles.map((tile) => tile.name));
  for (const [name, count] of counts.entries()) {
    if (named.has(name)) continue;
    tiles.push({
      key: name,
      name,
      count,
      imageUrl: fallbackImage.get(name) || '',
      sortOrder: 900,
    });
  }

  return tiles.sort((a, b) => {
    const order = (a.sortOrder - b.sortOrder) || a.name.localeCompare(b.name);
    return order;
  });
}

export function filterMenuFamilies({
  items,
  category,
  listFilter,
  query,
  storeId,
  rankByPunch,
  uncategorizedLabel,
}) {
  const q = String(query || '').trim().toLowerCase();
  const punchMap = rankByPunch ? readMenuPunchMap(storeId) : {};
  const favoriteKeys = new Set(readMenuFavorites(storeId));
  const visible = (items || []).filter((item) => {
    const cat = item.category || uncategorizedLabel;
    if (category && cat !== category) return false;
    if (listFilter === 'discounts') {
      const tags = parseTags(item.tags);
      if (!tags.includes('SALE') && !tags.includes('DISCOUNT') && !tags.includes('PROMO')) {
        return false;
      }
    }
    if (!q) return true;
    const hay = `${item.name || ''} ${item.sku || ''} ${item.description || ''} ${item.barcode || ''}`.toLowerCase();
    return hay.includes(q);
  });

  let families = groupMenuFamilies(visible);
  if (listFilter === 'favorites') {
    return families.filter((family) => favoriteKeys.has(String(family.key)));
  }
  if (listFilter === 'recent' && rankByPunch) {
    families = families
      .filter((family) => familyPunchScore(family, punchMap) > 0)
      .sort((a, b) => familyPunchScore(b, punchMap) - familyPunchScore(a, punchMap));
    return families;
  }

  if (!rankByPunch) return families;
  return families.sort((a, b) => {
    const scoreDiff = familyPunchScore(b, punchMap) - familyPunchScore(a, punchMap);
    if (scoreDiff !== 0) return scoreDiff;
    const hitDiff = Number(hasHitTag(b.primary)) - Number(hasHitTag(a.primary));
    if (hitDiff !== 0) return hitDiff;
    return String(a.primary?.name || '').localeCompare(String(b.primary?.name || ''), undefined, {
      sensitivity: 'base',
    });
  });
}

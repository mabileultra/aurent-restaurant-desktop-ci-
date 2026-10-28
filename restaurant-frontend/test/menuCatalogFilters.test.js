import { describe, expect, it } from 'vitest';
import {
  buildCategoryTiles,
  familyCategoryName,
  familyImageUrl,
} from '../src/restaurant/pos/utils/menuCatalogFilters.js';

describe('menuCatalogFilters', () => {
  const items = [
    { id: '1', name: 'Salad', category: 'Salads', price: 10, imageUrl: 'img-a', active: true },
    { id: '2', name: 'Soup', category: 'Soups', price: 12, imageUrl: '', active: true },
    { id: '3', name: 'Soup XL', category: 'Soups', price: 18, imageUrl: 'img-soup', active: true, variantGroupId: 'g1' },
  ];

  it('builds tiles with category image or dish fallback', () => {
    const tiles = buildCategoryTiles(
      items,
      [{ name: 'Salads', sortOrder: 1, active: true, imageUrl: 'cat-salads' }],
      'Other',
    );
    const salads = tiles.find((t) => t.name === 'Salads');
    const soups = tiles.find((t) => t.name === 'Soups');
    expect(salads.imageUrl).toBe('cat-salads');
    expect(soups.imageUrl).toBe('img-soup');
    expect(salads.count).toBe(1);
    expect(soups.count).toBeGreaterThanOrEqual(1);
  });

  it('family helpers resolve category and image', () => {
    const family = {
      key: 'k',
      primary: items[0],
      variants: [items[0]],
      multi: false,
    };
    expect(familyCategoryName(family, 'Other')).toBe('Salads');
    expect(familyImageUrl(family)).toBe('img-a');
  });
});

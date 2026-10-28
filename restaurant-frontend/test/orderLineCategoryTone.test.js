import { describe, expect, it } from 'vitest';
import {
  buildCategoryByMenuId,
  categoryTone,
  resolveOrderLineToneKey,
} from '../src/restaurant/pos/utils/orderLineCategoryTone.js';

describe('orderLineCategoryTone', () => {
  it('maps category by string id', () => {
    const map = buildCategoryByMenuId([
      { id: 'a1', category: 'Pizza' },
      { id: 'b2', category: '' },
    ]);
    expect(map.a1).toBe('Pizza');
    expect(map.b2).toBe('');
  });

  it('falls back to dish name when category missing', () => {
    const key = resolveOrderLineToneKey(
      { menuItemId: 'x', menuItemName: 'Stakan', name: 'Stakan' },
      {},
    );
    expect(key).toBe('Stakan');
    expect(categoryTone(key)).toBeGreaterThan(0);
  });

  it('prefers category from map', () => {
    const map = buildCategoryByMenuId([{ id: 'x', category: 'Drinks' }]);
    expect(resolveOrderLineToneKey({ menuItemId: 'x', menuItemName: 'Tea' }, map)).toBe('Drinks');
  });
});

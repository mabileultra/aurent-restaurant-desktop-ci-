import { describe, expect, it } from 'vitest';
import {
  buildMenuDishExportBytes,
  normalizeMenuDishImportRow,
  parseMenuDishWorkbook,
} from '../src/restaurant/admin/utils/menuDishSpreadsheet.js';
import { mapHeaderToKey } from '../src/restaurant/admin/utils/menuDishSpreadsheetColumns.js';

describe('menuDishSpreadsheet', () => {
  it('maps RU/EN headers to keys', () => {
    expect(mapHeaderToKey('Название')).toBe('name');
    expect(mapHeaderToKey('цена')).toBe('price');
    expect(mapHeaderToKey('ikpu')).toBe('ikpu');
    expect(mapHeaderToKey('Категория')).toBe('category');
  });

  it('round-trips export → parse → normalize', async () => {
    const bytes = await buildMenuDishExportBytes([
      {
        id: 1,
        name: 'Burger',
        sku: 'B1',
        price: 25000,
        taxRate: 0,
        available: true,
        sortOrder: 10,
        category: 'Burger',
        menuCategoryId: 5,
        stationId: 2,
        ikpu: '01709001001000000',
        markedProduct: false,
      },
    ], {
      stations: [{ id: 2, name: 'Grill' }],
      menuCategories: [{ id: 5, name: 'Burger' }],
    });

    const parsed = await parseMenuDishWorkbook(bytes.buffer ?? bytes);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].raw.name).toBe('Burger');

    const row = normalizeMenuDishImportRow(parsed[0], {
      stations: [{ id: 2, name: 'Grill' }],
      menuCategories: [{ id: 5, name: 'Burger' }],
      existingItems: [{ id: 1, sku: 'B1', modifierGroupIds: [9] }],
    });
    expect(row.ok).toBe(true);
    expect(row.action).toBe('UPDATE');
    expect(row.draft.stationId).toBe(2);
    expect(row.draft.menuCategoryId).toBe(5);
    expect(row.draft.modifierGroupIds).toEqual([9]);
    expect(row.draft.ikpu).toBe('01709001001000000');
  });
});

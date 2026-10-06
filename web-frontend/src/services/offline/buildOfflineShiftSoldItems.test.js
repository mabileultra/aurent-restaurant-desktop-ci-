import { describe, expect, it } from 'vitest';
import { buildOfflineShiftSoldItems } from './buildOfflineShiftSoldItems';

describe('buildOfflineShiftSoldItems', () => {
  it('суммирует один товар из разных чеков', () => {
    const sales = [
      { items: [{ productName: 'Хлеб', productSku: 'B1', quantity: 2, lineTotal: 8000 }] },
      { items: [
        { productName: 'Хлеб', productSku: 'B1', quantity: 1, lineTotal: 4000 },
        { productName: 'Молоко', productSku: 'M1', quantity: 1, lineTotal: 12000 },
      ] },
    ];
    const res = buildOfflineShiftSoldItems(sales, { from: 'a', to: 'b' });
    expect(res.from).toBe('a');
    expect(res.items).toEqual([
      { name: 'Молоко', quantity: 1, amount: 12000 },
      { name: 'Хлеб', quantity: 3, amount: 12000 },
    ]);
  });

  it('пустая смена → пустой список', () => {
    expect(buildOfflineShiftSoldItems([]).items).toEqual([]);
  });
});

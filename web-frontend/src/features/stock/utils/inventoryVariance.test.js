import { describe, expect, it } from 'vitest';
import { inventoryFormReady, inventoryLineVariance, summarizeInventory } from './inventoryVariance';

describe('inventoryLineVariance', () => {
  it('marks a counted match, shortage and surplus', () => {
    const product = { stockQuantity: 10, costPrice: 5 };
    expect(inventoryLineVariance({ productId: '1', product, countedQuantity: '10' }).status).toBe('match');
    expect(inventoryLineVariance({ productId: '1', product, countedQuantity: '8' }).status).toBe('shortage');
    expect(inventoryLineVariance({ productId: '1', product, countedQuantity: '12' }).money).toBe(10);
  });

  it('ignores a line until fact is entered', () => {
    expect(inventoryLineVariance({ productId: '1', product: { stockQuantity: 4 }, countedQuantity: '' }).status).toBe('empty');
  });
});

describe('summarizeInventory', () => {
  it('counts only filled and counted lines', () => {
    const summary = summarizeInventory([
      { productId: '1', product: { stockQuantity: 10, costPrice: 2 }, countedQuantity: '8' },
      { productId: '2', product: { stockQuantity: 3, costPrice: 1 }, countedQuantity: '3' },
      { productId: '', countedQuantity: '' },
    ]);
    expect(summary.total).toBe(2);
    expect(summary.shortage).toBe(1);
    expect(summary.match).toBe(1);
    expect(summary.money).toBe(-4);
    expect(inventoryFormReady({ storeId: 's', summary })).toBe(true);
  });
});

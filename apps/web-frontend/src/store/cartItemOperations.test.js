import { describe, expect, it } from 'vitest';
import {
  addPieceItemToCart,
  addWeightLineToCart,
  patchCartLineInCart,
  removeItemFromCart,
  updateDiscountPercentInCart,
  updateQuantityInCart,
} from './cartItemOperations';

describe('cartItemOperations', () => {
  const dummyProduct = {
    id: 101,
    name: 'Apple',
    sellingPrice: 10000,
    costPrice: 8000,
    saleType: 'PIECE',
    taxRate: 12,
  };

  it('adds piece item to empty cart', () => {
    const result = addPieceItemToCart([], dummyProduct, 2, 0);
    expect(result.items).toHaveLength(1);
    expect(result.items[0].quantity).toBe(2);
    expect(result.items[0].unitPrice).toBe(10000);
  });

  it('increments quantity when adding same piece item', () => {
    const first = addPieceItemToCart([], dummyProduct, 1, 0);
    const second = addPieceItemToCart(first.items, dummyProduct, 3, 0);
    expect(second.items).toHaveLength(1);
    expect(second.items[0].quantity).toBe(4);
  });

  it('adds weight line to cart', () => {
    const result = addWeightLineToCart([], dummyProduct, 1.5, 0);
    expect(result.items).toHaveLength(1);
    expect(result.items[0].quantity).toBe(1.5);
  });

  it('updates quantity and removes item when qty <= 0', () => {
    const first = addPieceItemToCart([], dummyProduct, 2, 0);
    const lineId = first.lineId;
    const updated = updateQuantityInCart(first.items, lineId, 5, 0);
    expect(updated.items[0].quantity).toBe(5);

    const zeroed = updateQuantityInCart(first.items, lineId, 0, 0);
    expect(zeroed.items).toHaveLength(0);
  });

  it('updates discount percent and removes item', () => {
    const first = addPieceItemToCart([], dummyProduct, 1, 0);
    const lineId = first.lineId;
    const discounted = updateDiscountPercentInCart(first.items, lineId, 10, 0);
    expect(discounted.items[0].discountPercent).toBe(10);

    const removed = removeItemFromCart(discounted.items, lineId, 0);
    expect(removed.items).toHaveLength(0);
  });
});

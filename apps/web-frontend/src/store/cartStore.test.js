import { beforeEach, describe, expect, it } from 'vitest';
import { useCartStore } from './cartStore';

describe('cartStore', () => {
  beforeEach(() => {
    useCartStore.getState().clearCart();
    useCartStore.getState().clearParkedCarts();
  });

  it('adds piece item and updates line', () => {
    const store = useCartStore.getState();
    const product = { id: 10, name: 'Sut', sellingPrice: 12000, saleType: 'PIECE' };
    const lineId = store.addPieceItem(product, 2);
    expect(lineId).toBeDefined();

    expect(useCartStore.getState().items).toHaveLength(1);
    expect(useCartStore.getState().items[0].quantity).toBe(2);
    expect(useCartStore.getState().getTotal()).toBe(24000);

    store.updateQuantity(lineId, 3);
    expect(useCartStore.getState().items[0].quantity).toBe(3);
    expect(useCartStore.getState().getTotal()).toBe(36000);
  });

  it('holds and restores cart', () => {
    const store = useCartStore.getState();
    const product = { id: 20, name: 'Non', sellingPrice: 5000, saleType: 'PIECE' };
    store.addPieceItem(product, 1);

    const holdResult = store.holdCart();
    expect(holdResult).toBe('held');
    expect(useCartStore.getState().items).toHaveLength(0);
    expect(useCartStore.getState().parkedCarts).toHaveLength(1);

    const restoreResult = store.holdCart();
    expect(restoreResult).toBe('restored');
    expect(useCartStore.getState().items).toHaveLength(1);
    expect(useCartStore.getState().parkedCarts).toHaveLength(0);
  });
});

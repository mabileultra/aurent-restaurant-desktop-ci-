import { beforeEach, describe, expect, it } from 'vitest';
import { useCartStore } from './cartStore';

const RX_PRODUCT = {
  id: 10,
  name: 'Amoksitsillin',
  sellingPrice: 12000,
  stockQuantity: 5,
  retailExtras: { pharmacyPrescriptionRequired: true },
};
const PLAIN_PRODUCT = { id: 11, name: 'Vitamin C', sellingPrice: 5000, stockQuantity: 5 };

describe('cartStore: prescription number', () => {
  beforeEach(() => {
    useCartStore.setState({ parkedCarts: [] });
    useCartStore.getState().clearCart();
  });

  it('marks cart lines of prescription products', () => {
    useCartStore.getState().addPieceItem(RX_PRODUCT);
    useCartStore.getState().addPieceItem(PLAIN_PRODUCT);
    const [rxLine, plainLine] = useCartStore.getState().items;
    expect(rxLine.requiresPrescription).toBe(true);
    expect(plainLine.requiresPrescription).toBe(false);
  });

  it('normalizes and clears the number', () => {
    useCartStore.getState().setPrescriptionNumber('  RX-1  ');
    expect(useCartStore.getState().prescriptionNumber).toBe('RX-1');
    useCartStore.getState().clearPrescriptionNumber();
    expect(useCartStore.getState().prescriptionNumber).toBe('');
  });

  it('clearCart resets the number after a sale', () => {
    useCartStore.getState().addPieceItem(RX_PRODUCT);
    useCartStore.getState().setPrescriptionNumber('RX-1');
    useCartStore.getState().clearCart();
    expect(useCartStore.getState().prescriptionNumber).toBe('');
  });

  it('hold and restore keep the number with its own check', () => {
    useCartStore.getState().addPieceItem(RX_PRODUCT);
    useCartStore.getState().setPrescriptionNumber('RX-1');
    expect(useCartStore.getState().holdCart()).toBe('held');
    expect(useCartStore.getState().prescriptionNumber).toBe('');

    expect(useCartStore.getState().holdCart()).toBe('restored');
    expect(useCartStore.getState().prescriptionNumber).toBe('RX-1');
    expect(useCartStore.getState().items).toHaveLength(1);
  });
});

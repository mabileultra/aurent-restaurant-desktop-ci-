import { beforeEach, describe, expect, it } from 'vitest';
import { useCartStore } from '../../../store/cartStore';
import {
  pharmacyCartDisplayPrice,
  updatePharmacyCartLinePrice,
} from './pharmacyCartActions';

describe('updatePharmacyCartLinePrice', () => {
  beforeEach(() => {
    useCartStore.setState({ items: [], orderDiscountAmount: 0 });
  });

  it('updates unit price for normal lines', () => {
    useCartStore.setState({
      items: [{
        lineId: 'l1',
        productId: 'p1',
        name: 'X',
        quantity: 2,
        unitPrice: 1000,
        discountPercent: 0,
        discount: 0,
        pharmacySellByPiece: false,
      }],
    });

    updatePharmacyCartLinePrice('l1', '1500');
    const item = useCartStore.getState().items[0];
    expect(item.unitPrice).toBe(1500);
    expect(pharmacyCartDisplayPrice(item)).toBe(1500);
  });

  it('updates pack price and piece unit price together', () => {
    useCartStore.setState({
      items: [{
        lineId: 'l1',
        productId: 'p1',
        name: 'Y',
        quantity: 10,
        unitPrice: 800,
        packUnitPrice: 80000,
        unitsInPack: 100,
        pharmacySellByPiece: true,
        discountPercent: 0,
        discount: 0,
      }],
    });

    updatePharmacyCartLinePrice('l1', '90000');
    const item = useCartStore.getState().items[0];
    expect(item.packUnitPrice).toBe(90000);
    expect(item.unitPrice).toBe(900);
    expect(pharmacyCartDisplayPrice(item)).toBe(90000);
  });
});

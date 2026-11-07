import { describe, expect, it } from 'vitest';
import {
  fiscalCartTotal,
  orderToMultikassaCartItems,
} from '../../../../src/restaurant/pos/utils/buildRestaurantFiscalSale';

describe('orderToMultikassaCartItems', () => {
  it('keeps priced IKPU dishes and drops a zero-price line', () => {
    const items = orderToMultikassaCartItems({
      items: [
        { id: 'a', name: 'Choy', quantity: 2, unitPrice: 12000, ikpu: '111', itemStatus: 'SENT_TO_KITCHEN' },
        { id: 'b', name: 'Salat Non Choy', quantity: 8, unitPrice: 0, lineTotal: 0, ikpu: '222', itemStatus: 'SENT_TO_KITCHEN' },
        { id: 'c', name: 'No ikpu', quantity: 1, unitPrice: 5000, ikpu: '', itemStatus: 'SENT_TO_KITCHEN' },
      ],
    });

    expect(items.map((line) => line.name)).toEqual(['Choy']);
    expect(fiscalCartTotal(items)).toBe(24000);
  });

  it('uses lineTotal when unitPrice is missing but the line still costs money', () => {
    const items = orderToMultikassaCartItems({
      items: [
        { id: 'a', name: 'Eurob', quantity: 2, unitPrice: 0, lineTotal: 14000, ikpu: '333' },
      ],
    });

    expect(items).toHaveLength(1);
    expect(items[0].unitPrice).toBe(7000);
  });
});

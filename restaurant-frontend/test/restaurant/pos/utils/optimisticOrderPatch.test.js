import { describe, expect, it } from 'vitest';
import { optimisticAddItem } from '../../../../src/restaurant/pos/utils/optimisticOrderPatch';

const dish = { id: 'm1', name: 'BEHAMAD', price: 18000 };

describe('optimisticAddItem reorder merge', () => {
  it('bumps NEW line qty instead of appending', () => {
    const order = {
      status: 'OPEN',
      items: [{
        id: 'i1',
        menuItemId: 'm1',
        name: 'BEHAMAD',
        quantity: 1,
        unitPrice: 18000,
        lineTotal: 18000,
        itemStatus: 'NEW',
        modifiers: [],
        note: null,
      }],
    };
    const next = optimisticAddItem(order, dish);
    expect(next.items).toHaveLength(1);
    expect(next.items[0].quantity).toBe(2);
    expect(next.items[0].lineTotal).toBe(36000);
    expect(next.subtotal).toBe(36000);
  });

  it('merges into kitchen line and keeps sentQuantity (pending delta)', () => {
    const order = {
      status: 'OPEN',
      items: [{
        id: 'i1',
        menuItemId: 'm1',
        name: 'BEHAMAD',
        quantity: 1,
        sentQuantity: 1,
        unitPrice: 18000,
        lineTotal: 18000,
        itemStatus: 'SENT_TO_KITCHEN',
        modifiers: [],
        note: null,
      }],
    };
    const next = optimisticAddItem(order, dish);
    expect(next.items).toHaveLength(1);
    expect(next.items[0].quantity).toBe(2);
    expect(next.items[0].sentQuantity).toBe(1);
    expect(next.items[0].itemStatus).toBe('SENT_TO_KITCHEN');
    expect(next.items[0].lineTotal).toBe(36000);
  });

  it('prefers NEW line over kitchen when both exist', () => {
    const order = {
      status: 'OPEN',
      items: [
        {
          id: 'k1',
          menuItemId: 'm1',
          quantity: 2,
          sentQuantity: 2,
          unitPrice: 18000,
          lineTotal: 36000,
          itemStatus: 'SENT_TO_KITCHEN',
          modifiers: [],
          note: null,
        },
        {
          id: 'n1',
          menuItemId: 'm1',
          quantity: 1,
          unitPrice: 18000,
          lineTotal: 18000,
          itemStatus: 'NEW',
          modifiers: [],
          note: null,
        },
      ],
    };
    const next = optimisticAddItem(order, dish);
    expect(next.items).toHaveLength(2);
    expect(next.items.find((r) => r.id === 'n1').quantity).toBe(2);
    expect(next.items.find((r) => r.id === 'k1').quantity).toBe(2);
  });

  it('does not merge when note or modifiers differ', () => {
    const order = {
      status: 'OPEN',
      items: [{
        id: 'i1',
        menuItemId: 'm1',
        quantity: 1,
        sentQuantity: 1,
        unitPrice: 18000,
        lineTotal: 18000,
        itemStatus: 'SENT_TO_KITCHEN',
        modifiers: [],
        note: null,
      }],
    };
    const withNote = optimisticAddItem(order, dish, { note: 'без лука' });
    expect(withNote.items).toHaveLength(2);
    expect(withNote.items[1].itemStatus).toBe('NEW');
    expect(withNote.items[1].note).toBe('без лука');

    const withMods = optimisticAddItem(order, dish, { modifierOptionIds: ['opt-1'] });
    expect(withMods.items).toHaveLength(2);
    expect(withMods.items[1].itemStatus).toBe('NEW');
  });

  it('does not merge into CANCELLED kitchen line', () => {
    const order = {
      status: 'OPEN',
      items: [{
        id: 'i1',
        menuItemId: 'm1',
        quantity: 0,
        sentQuantity: 1,
        unitPrice: 18000,
        lineTotal: 0,
        itemStatus: 'CANCELLED',
        modifiers: [],
        note: null,
      }],
    };
    const next = optimisticAddItem(order, dish);
    expect(next.items).toHaveLength(2);
    expect(next.items[1].itemStatus).toBe('NEW');
    expect(next.items[1].quantity).toBe(1);
  });
});

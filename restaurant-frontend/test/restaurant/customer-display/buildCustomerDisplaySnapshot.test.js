import { describe, expect, it } from 'vitest';
import { buildCustomerDisplaySnapshot } from '../../../src/restaurant/customer-display/buildCustomerDisplaySnapshot';
import { CFD_PHASE } from '../../../src/restaurant/customer-display/customerDisplayChannel';

describe('buildCustomerDisplaySnapshot', () => {
  it('stays idle without lines', () => {
    const snap = buildCustomerDisplaySnapshot({ storeName: 'Hall' });
    expect(snap.phase).toBe(CFD_PHASE.IDLE);
    expect(snap.storeName).toBe('Hall');
  });

  it('shows active ticket with discount', () => {
    const snap = buildCustomerDisplaySnapshot({
      storeName: 'Hall',
      order: {
        orderNo: 125,
        subtotal: 160000,
        discountAmount: 16000,
        totalAmount: 144000,
        items: [
          { id: '1', name: 'Plov', quantity: 1, lineTotal: 80000, itemStatus: 'NEW' },
          { id: '2', name: 'Tea', quantity: 2, lineTotal: 80000, itemStatus: 'SENT_TO_KITCHEN' },
          { id: '3', name: 'Void', quantity: 1, lineTotal: 1000, itemStatus: 'CANCELLED' },
        ],
      },
    });
    expect(snap.phase).toBe(CFD_PHASE.ACTIVE);
    expect(snap.orderNo).toBe(125);
    expect(snap.lines).toHaveLength(2);
    expect(snap.discountAmount).toBe(16000);
    expect(snap.total).toBe(144000);
  });

  it('switches to paying and thanks', () => {
    const order = {
      orderNo: 1,
      subtotal: 1000,
      items: [{ id: '1', name: 'Tea', quantity: 1, lineTotal: 1000 }],
    };
    expect(buildCustomerDisplaySnapshot({ order, payModalOpen: true }).phase).toBe(CFD_PHASE.PAYING);
    expect(buildCustomerDisplaySnapshot({
      paidSale: { orderNo: 1, totalAmount: 1000 },
    }).phase).toBe(CFD_PHASE.THANKS);
  });
});

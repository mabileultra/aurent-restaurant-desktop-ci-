import { describe, expect, it } from 'vitest';
import {
  buildWaiters,
  computeCommissionPreview,
  displayUserName,
  resolveOrderFlags,
  userStoreIds,
} from '../../../../src/restaurant/pos/utils/floorPosDerivations';

describe('floorPosDerivations', () => {
  it('reads store ids from user', () => {
    expect(userStoreIds({ storeIds: ['1', 2] })).toEqual([1, 2]);
    expect(userStoreIds({ stores: [{ id: 3 }, 4] })).toEqual([3, 4]);
  });

  it('builds waiter list for store', () => {
    const staff = [
      { id: 1, role: 'WAITER', active: true, storeIds: [10], fullName: 'A' },
      { id: 2, role: 'COOK', active: true, storeIds: [10], fullName: 'B' },
      { id: 3, role: 'WAITER', active: false, storeIds: [10], fullName: 'C' },
      { id: 4, role: 'WAITER', active: true, storeIds: [99], fullName: 'D' },
    ];
    expect(buildWaiters(staff, 10)).toEqual([{ id: 1, name: 'A' }]);
  });

  it('computes commission preview', () => {
    expect(computeCommissionPreview({ channel: 'TAKEAWAY' }, null)).toBeNull();
    expect(computeCommissionPreview(
      { channel: 'DINE_IN', commissionPercent: 5, commissionAmount: 12 },
      null,
    )).toEqual({ percent: 5, amount: 12 });
    expect(computeCommissionPreview(
      { channel: 'DINE_IN', subtotal: 200, waiterUserId: 1 },
      { defaultPercent: 10, overrides: [] },
    )).toEqual({ percent: 10, amount: 20 });
  });

  it('resolves order action flags', () => {
    expect(resolveOrderFlags({ status: 'BILLING', items: [{ itemStatus: 'READY' }] }).canPay).toBe(true);
    expect(resolveOrderFlags({ status: 'OPEN', items: [{ itemStatus: 'NEW' }] }).canSendKitchen).toBe(true);
    expect(resolveOrderFlags({ status: 'OPEN', items: [{ itemStatus: 'NEW' }] }, false).canRequestBill).toBe(false);
    expect(resolveOrderFlags({ status: 'OPEN', items: [{ itemStatus: 'SENT_TO_KITCHEN' }] }, false).canRequestBill).toBe(true);
    expect(displayUserName({ username: 'x' })).toBe('x');
  });
});

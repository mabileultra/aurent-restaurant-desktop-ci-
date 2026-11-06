import { describe, expect, it, beforeEach, vi } from 'vitest';

const store = new Map();

vi.stubGlobal('localStorage', {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => { store.set(k, String(v)); },
  removeItem: (k) => { store.delete(k); },
});

vi.mock('../../../../src/services/multikassa/retryPendingFiscalOnPayload', () => ({
  retryPendingFiscalOnPayload: vi.fn(async (payload) => ({
    ...payload,
    fiscal: { ...payload.fiscal, fiscalStatus: 'FISCALIZED' },
  })),
}));

import { FISCAL_STATUS } from '../../../../src/services/multikassa/multikassaConstants';
import {
  enqueuePendingFiscal,
  flushPendingFiscals,
} from '../../../../src/restaurant/pos/utils/pendingFiscalQueue';

describe('pendingFiscalQueue', () => {
  beforeEach(() => {
    store.clear();
  });

  it('enqueues and flushes pending fiscal', async () => {
    enqueuePendingFiscal({
      storeId: 1,
      orderId: 'o1',
      fiscal: {
        fiscalStatus: FISCAL_STATUS.PENDING,
        multikassaRetryBody: { x: 1 },
      },
    });
    const result = await flushPendingFiscals();
    expect(result.done).toBe(1);
    expect(result.left).toBe(0);
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';

const runMultikassaOperation = vi.fn();
const assertOnkmMarking = vi.fn(async () => undefined);

vi.mock('./runMultikassaOperation', () => ({
  runMultikassaOperation: (...args) => runMultikassaOperation(...args),
}));

vi.mock('../../features/marking/onkm', () => ({
  assertOnkmMarking: (...args) => assertOnkmMarking(...args),
}));

vi.mock('./buildMultikassaOperations', () => ({
  buildRefundBody: () => ({ operation: 4 }),
}));

import { fiscalizeRefundBeforeCommit } from './fiscalizeRefundBeforeCommit';

describe('fiscalizeRefundBeforeCommit', () => {
  beforeEach(() => {
    runMultikassaOperation.mockReset();
    assertOnkmMarking.mockReset();
    assertOnkmMarking.mockResolvedValue(undefined);
    runMultikassaOperation.mockResolvedValue({ fiscalStatus: 'FISCALIZED' });
  });

  it('validates marks with refund=true before Multikassa op 4', async () => {
    const sale = {
      multikassaSaleId: 'sale-1',
      items: [{ ikpu: '02208005001025008', productMarks: ['0105'] }],
    };
    await fiscalizeRefundBeforeCommit({
      capabilities: { enabled: true, baseUrl: 'http://127.0.0.1:8080', cashRegisterId: 11, terminalId: 'TERM1' },
      sale,
    });
    expect(assertOnkmMarking).toHaveBeenCalledWith(expect.objectContaining({
      cashRegisterId: 11,
      cartItems: sale.items,
      refund: true,
    }));
    expect(runMultikassaOperation).toHaveBeenCalled();
  });

  it('blocks refund when Tasnif rejects the KM', async () => {
    const err = new Error('Код заблокирован');
    err.code = 'MULTIKASSA_MARKING_REJECTED';
    err.markingCode = '2080';
    assertOnkmMarking.mockRejectedValue(err);

    await expect(
      fiscalizeRefundBeforeCommit({
        capabilities: { enabled: true, baseUrl: 'http://127.0.0.1:8080', cashRegisterId: 11 },
        sale: { multikassaSaleId: 'sale-1', items: [{ productMarks: ['x'] }] },
      }),
    ).rejects.toMatchObject({ code: 'MULTIKASSA_MARKING_REJECTED' });
    expect(runMultikassaOperation).not.toHaveBeenCalled();
  });
});

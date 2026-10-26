import { beforeEach, describe, expect, it, vi } from 'vitest';

const validateFiscalMarking = vi.fn();

vi.mock('./validate', () => ({
  MARKING_VALIDATION_STATUS: {
    VALID: 'VALID',
    REJECTED: 'REJECTED',
    UNAVAILABLE: 'UNAVAILABLE',
    NOT_REQUIRED: 'NOT_REQUIRED',
  },
  validateFiscalMarking: (...args) => validateFiscalMarking(...args),
}));

import { assertOnkmMarking } from './assertBeforeSale';

describe('assertOnkmMarking', () => {
  beforeEach(() => {
    validateFiscalMarking.mockReset();
  });

  it('skips when Tasnif is not required', async () => {
    validateFiscalMarking.mockResolvedValue({ status: 'NOT_REQUIRED' });
    await expect(assertOnkmMarking({ cashRegisterId: 1, cartItems: [] })).resolves.toBeUndefined();
  });

  it('blocks withdrawn KM 1016 / 2070', async () => {
    validateFiscalMarking.mockResolvedValue({
      status: 'REJECTED',
      code: '1016',
      message: 'Код уже выведен из оборота',
    });
    await expect(
      assertOnkmMarking({ cashRegisterId: 11, cartItems: [{ productMarks: ['x'] }] }),
    ).rejects.toMatchObject({
      code: 'MULTIKASSA_MARKING_REJECTED',
      markingCode: '1016',
      message: 'Код уже выведен из оборота',
    });
  });

  it('UNAVAILABLE is always soft — sale still goes to Multikassa', async () => {
    validateFiscalMarking.mockResolvedValue({
      status: 'UNAVAILABLE',
      code: 'TIMEOUT',
      message: 'Tasnif не ответил',
    });
    const err = await assertOnkmMarking({
      cashRegisterId: 11,
      cartItems: [{ productMarks: ['x'] }],
      requireBeforeSale: true,
    }).catch((e) => e);
    expect(err.code).toBe('MULTIKASSA_MARKING_UNAVAILABLE');
    expect(err.soft).toBe(true);
  });

  it('soft-fails UNAVAILABLE when requireBeforeSale is off', async () => {
    validateFiscalMarking.mockResolvedValue({ status: 'UNAVAILABLE', message: 'нет сети' });
    await expect(
      assertOnkmMarking({
        cashRegisterId: 11,
        cartItems: [{ productMarks: ['x'] }],
        requireBeforeSale: false,
      }),
    ).rejects.toMatchObject({
      code: 'MULTIKASSA_MARKING_UNAVAILABLE',
      soft: true,
    });
  });
});

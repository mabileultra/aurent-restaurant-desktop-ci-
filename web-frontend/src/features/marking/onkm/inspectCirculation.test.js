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

import { inspectMarkCirculation } from './inspectCirculation';

const MARK = '010509987308971221uC*NTOg';
const product = { id: 1, ikpu: '02208005001025008', packageCode: '1077302' };

describe('inspectMarkCirculation', () => {
  beforeEach(() => {
    validateFiscalMarking.mockReset();
  });

  it('skips without cash register', async () => {
    await expect(inspectMarkCirculation({ product, mark: MARK })).resolves.toEqual({ status: 'skipped' });
    expect(validateFiscalMarking).not.toHaveBeenCalled();
  });

  it('in circulation when Tasnif says VALID', async () => {
    validateFiscalMarking.mockResolvedValue({ status: 'VALID' });
    await expect(inspectMarkCirculation({ cashRegisterId: 11, product, mark: MARK }))
      .resolves.toMatchObject({ status: 'in-circulation' });
  });

  it('not in circulation for withdrawn 1016', async () => {
    validateFiscalMarking.mockResolvedValue({
      status: 'REJECTED',
      code: '1016',
      message: 'Код уже выведен из оборота',
    });
    await expect(inspectMarkCirculation({ cashRegisterId: 11, product, mark: MARK }))
      .resolves.toEqual({
        status: 'not-in-circulation',
        withdrawn: true,
        code: '1016',
        message: 'Код уже выведен из оборота',
      });
  });

  it('NOT_REQUIRED is not in circulation', async () => {
    validateFiscalMarking.mockResolvedValue({ status: 'NOT_REQUIRED' });
    await expect(inspectMarkCirculation({ cashRegisterId: 11, product, mark: MARK }))
      .resolves.toMatchObject({ status: 'skipped' });
  });

  it('empty result is not in circulation', async () => {
    validateFiscalMarking.mockResolvedValue(null);
    await expect(inspectMarkCirculation({ cashRegisterId: 11, product, mark: MARK }))
      .resolves.toMatchObject({ status: 'skipped' });
  });

  it('unavailable is not success', async () => {
    validateFiscalMarking.mockResolvedValue({ status: 'UNAVAILABLE', message: 'нет сети' });
    await expect(inspectMarkCirculation({ cashRegisterId: 11, product, mark: MARK }))
      .resolves.toMatchObject({ status: 'unavailable', message: 'нет сети' });
  });
});

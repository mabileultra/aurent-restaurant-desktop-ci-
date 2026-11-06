import { beforeEach, describe, expect, it, vi } from 'vitest';

const lookupTasnifIdentity = vi.fn();
const validateFiscalMarking = vi.fn();

vi.mock('../../marking/lookupProductByMarkingGtin', () => ({
  lookupTasnifIdentity: (...args) => lookupTasnifIdentity(...args),
}));

vi.mock('../../marking/onkm/validate', () => ({
  validateFiscalMarking: (...args) => validateFiscalMarking(...args),
}));

import { checkPharmacyReturnMark } from './checkPharmacyReturnMark';

const MARK = '010478001234567821SERIAL';
const IKPU = '08470001002000000';

const sale = {
  items: [{
    id: 'line-1',
    productName: 'Азитромицин',
    ikpu: IKPU,
    quantity: 1,
    returnedQuantity: 0,
  }],
};

beforeEach(() => {
  lookupTasnifIdentity.mockReset();
  validateFiscalMarking.mockReset();
  lookupTasnifIdentity.mockResolvedValue({ ikpu: IKPU, name: 'Азитромицин', packageCode: '123' });
  validateFiscalMarking.mockResolvedValue({ status: 'VALID' });
});

describe('checkPharmacyReturnMark', () => {
  it('без кассы владельца не подтверждает и в налоговую не ходит', async () => {
    const result = await checkPharmacyReturnMark({ cashRegisterId: null, mark: MARK, sale });
    expect(result.status).toBe('unconfirmed');
    expect(validateFiscalMarking).not.toHaveBeenCalled();
  });

  it('нет ИКПУ — код не принимаем', async () => {
    lookupTasnifIdentity.mockResolvedValue(null);
    const result = await checkPharmacyReturnMark({ cashRegisterId: 7, mark: MARK, sale });
    expect(result.status).toBe('unconfirmed');
    expect(validateFiscalMarking).not.toHaveBeenCalled();
  });

  it('чужой код 1002 не принимается, запрос с флагом возврата', async () => {
    validateFiscalMarking.mockResolvedValue({
      status: 'REJECTED',
      code: '1002',
      message: 'Указанный код маркировки не принадлежит вам.',
    });
    const result = await checkPharmacyReturnMark({ cashRegisterId: 7, mark: MARK, sale });
    expect(result.status).toBe('foreign');
    expect(validateFiscalMarking).toHaveBeenCalledWith(expect.objectContaining({
      cashRegisterId: 7,
      refund: true,
      cartItems: [expect.objectContaining({ ikpu: IKPU, productMarks: [MARK] })],
    }));
  });

  it('свой код из этого чека можно вернуть', async () => {
    const result = await checkPharmacyReturnMark({ cashRegisterId: 7, mark: MARK, sale });
    expect(result.status).toBe('ours');
    expect(result.line.id).toBe('line-1');
    expect(result.name).toBe('Азитромицин');
  });

  it('свой код, но не из этого чека', async () => {
    lookupTasnifIdentity.mockResolvedValue({ ikpu: '09999999999999999', name: 'Другой' });
    const result = await checkPharmacyReturnMark({ cashRegisterId: 7, mark: MARK, sale });
    expect(result.status).toBe('not-on-receipt');
  });

  it('налоговая недоступна — код не принимаем', async () => {
    validateFiscalMarking.mockResolvedValue({ status: 'UNAVAILABLE', message: 'нет связи' });
    const result = await checkPharmacyReturnMark({ cashRegisterId: 7, mark: MARK, sale });
    expect(result.status).toBe('unconfirmed');
    expect(result.message).toBe('нет связи');
  });
});

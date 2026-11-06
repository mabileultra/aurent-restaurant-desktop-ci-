import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../api/fiscal.api', () => ({
  fiscalApi: { getCashierCapabilities: vi.fn() },
}));

import { fiscalApi } from '../../api/fiscal.api';
import { loadFiscalCapabilities } from './loadFiscalCapabilities';

describe('loadFiscalCapabilities', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns cashier/fiscal payload', async () => {
    const data = { enabled: true, fiscalProvider: 'FISCAL_DRIVE', factoryId: 'F1' };
    fiscalApi.getCashierCapabilities.mockResolvedValue({ data });
    await expect(loadFiscalCapabilities(7, 3)).resolves.toBe(data);
    expect(fiscalApi.getCashierCapabilities).toHaveBeenCalledWith(7, 3);
  });

  it('does not treat a load error as disabled', async () => {
    fiscalApi.getCashierCapabilities.mockRejectedValue(new Error('down'));
    await expect(loadFiscalCapabilities(1)).rejects.toMatchObject({
      code: 'FISCAL_CAPABILITIES_LOAD_FAILED',
    });
  });
});

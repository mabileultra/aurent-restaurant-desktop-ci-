import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./loadFiscalCapabilities', () => ({
  loadFiscalCapabilities: vi.fn(),
}));

vi.mock('../multikassa/loadMultikassaCapabilities', () => ({
  loadMultikassaCapabilities: vi.fn(),
}));

vi.mock('../multikassa', () => ({
  fiscalizeSaleBeforeCommit: vi.fn(),
  fiscalizeRefundBeforeCommit: vi.fn(),
  fiscalizeShiftOperation: vi.fn(),
  retryPendingFiscalOnPayload: vi.fn(),
  isFiscalShiftAlreadyOpenError: vi.fn(),
  wrapMultikassaFiscalError: vi.fn((err) => err),
}));

import { loadFiscalCapabilities } from './loadFiscalCapabilities';
import { loadMultikassaCapabilities } from '../multikassa/loadMultikassaCapabilities';
import { FISCAL_PROVIDER, loadFiscalContext } from './index';

describe('loadFiscalContext', () => {
  beforeEach(() => vi.clearAllMocks());

  it('keeps a FiscalDrive register on Multikassa so the shift does not call port 3449', async () => {
    loadFiscalCapabilities.mockResolvedValue({
      enabled: true,
      fiscalProvider: 'FISCAL_DRIVE',
      baseUrl: 'http://127.0.0.1:3449',
    });
    loadMultikassaCapabilities.mockResolvedValue({
      enabled: false,
      baseUrl: 'http://localhost:8080',
      fiscalProvider: 'FISCAL_DRIVE',
    });

    const ctx = await loadFiscalContext(7, 3);

    expect(ctx.provider.id).toBe(FISCAL_PROVIDER.MULTIKASSA);
    expect(ctx.capabilities.fiscalProvider).toBe(FISCAL_PROVIDER.MULTIKASSA);
    expect(ctx.capabilities.baseUrl).toBe('http://localhost:8080');
    expect(ctx.capabilities.enabled).toBe(false);
  });
});

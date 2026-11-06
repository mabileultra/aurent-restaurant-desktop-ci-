import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../src/services/multikassa', () => ({
  loadMultikassaCapabilities: vi.fn(),
  fiscalizeSaleBeforeCommit: vi.fn(),
  fiscalizeRefundBeforeCommit: vi.fn(),
  fiscalizeShiftOperation: vi.fn(),
  retryPendingFiscalOnPayload: vi.fn(),
  resolveMultikassaFiscalErrorMessage: vi.fn(),
  wrapMultikassaFiscalError: vi.fn((err) => {
    const e = new Error(err?.message || 'MULTIKASSA_FISCAL_FAILED');
    e.code = 'MULTIKASSA_FISCAL_FAILED';
    return e;
  }),
}));

import * as multikassa from '../../../src/services/multikassa';
import {
  FISCAL_PROVIDER,
  loadFiscalContext,
  resolveFiscalProvider,
  resolvePendingFiscalProvider,
  wrapFiscalError,
} from '../../../src/services/fiscal';

describe('resolveFiscalProvider', () => {
  it('defaults to Multikassa for empty or unknown id', () => {
    expect(resolveFiscalProvider(undefined).id).toBe(FISCAL_PROVIDER.MULTIKASSA);
    expect(resolveFiscalProvider('').id).toBe(FISCAL_PROVIDER.MULTIKASSA);
    expect(resolveFiscalProvider('SOMETHING_ELSE').id).toBe(FISCAL_PROVIDER.MULTIKASSA);
  });
});

describe('loadFiscalContext', () => {
  beforeEach(() => vi.clearAllMocks());

  it('passes store and register through and keeps capabilities as-is', async () => {
    const caps = { enabled: true, requireBeforeSale: true, fiscalProvider: 'MULTIKASSA' };
    multikassa.loadMultikassaCapabilities.mockResolvedValue(caps);

    const ctx = await loadFiscalContext(7, 3);

    expect(multikassa.loadMultikassaCapabilities).toHaveBeenCalledWith(7, 3, {});
    expect(ctx.capabilities).toBe(caps);
    expect(ctx.provider.id).toBe(FISCAL_PROVIDER.MULTIKASSA);
  });
});

describe('multikassa provider adapter', () => {
  beforeEach(() => vi.clearAllMocks());

  it('delegates sale, retry and error helpers with the same arguments', async () => {
    const provider = resolveFiscalProvider(FISCAL_PROVIDER.MULTIKASSA);
    const t = (k) => k;
    multikassa.fiscalizeSaleBeforeCommit.mockResolvedValue({ fiscalSign: 'S' });
    multikassa.retryPendingFiscalOnPayload.mockResolvedValue({ retried: true });
    multikassa.resolveMultikassaFiscalErrorMessage.mockReturnValue('msg');

    await expect(provider.fiscalizeSale({ a: 1 })).resolves.toEqual({ fiscalSign: 'S' });
    await expect(provider.retryPending({ b: 2 }, { storeId: 3 })).resolves.toEqual({ retried: true });
    expect(provider.resolveErrorMessage('err', t)).toBe('msg');

    expect(multikassa.fiscalizeSaleBeforeCommit).toHaveBeenCalledWith({ a: 1 });
    expect(multikassa.retryPendingFiscalOnPayload).toHaveBeenCalledWith({ b: 2 }, { storeId: 3 });
    expect(multikassa.resolveMultikassaFiscalErrorMessage).toHaveBeenCalledWith('err', t);
  });
});

describe('wrapFiscalError / resolvePendingFiscalProvider', () => {
  it('fall back to Multikassa', () => {
    expect(wrapFiscalError(new Error('boom')).code).toBe('MULTIKASSA_FISCAL_FAILED');
    expect(resolvePendingFiscalProvider({ fiscal: {} }).id).toBe(FISCAL_PROVIDER.MULTIKASSA);
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./loadFiscalCapabilities', () => ({
  loadFiscalCapabilities: vi.fn(),
}));

vi.mock('../multikassa', () => ({
  fiscalizeSaleBeforeCommit: vi.fn(),
  fiscalizeRefundBeforeCommit: vi.fn(),
  fiscalizeShiftOperation: vi.fn(),
  retryPendingFiscalOnPayload: vi.fn(),
  isFiscalShiftAlreadyOpenError: vi.fn(),
  wrapMultikassaFiscalError: vi.fn((err) => {
    const e = new Error(err?.message || 'MULTIKASSA_FISCAL_FAILED');
    e.code = 'MULTIKASSA_FISCAL_FAILED';
    return e;
  }),
}));

import { loadFiscalCapabilities } from './loadFiscalCapabilities';
import * as multikassa from '../multikassa';
import {
  FISCAL_PROVIDER,
  isFiscalDriveProvider,
  loadFiscalContext,
  resolveFiscalProvider,
  resolvePendingFiscalProvider,
  wrapFiscalError,
} from './index';

describe('resolveFiscalProvider', () => {
  it('defaults to Multikassa for empty or unknown id', () => {
    expect(resolveFiscalProvider(undefined).id).toBe(FISCAL_PROVIDER.MULTIKASSA);
    expect(resolveFiscalProvider('').id).toBe(FISCAL_PROVIDER.MULTIKASSA);
    expect(resolveFiscalProvider('SOMETHING_ELSE').id).toBe(FISCAL_PROVIDER.MULTIKASSA);
  });

  it('does not treat a Multikassa register as FiscalDrive', () => {
    expect(isFiscalDriveProvider({ enabled: true, fiscalProvider: 'MULTIKASSA' })).toBe(false);
    expect(isFiscalDriveProvider({ enabled: true })).toBe(false);
    expect(isFiscalDriveProvider({ fiscalProvider: 'FISCAL_DRIVE' })).toBe(true);
  });

  it('matches id case-insensitively', () => {
    expect(resolveFiscalProvider(' multikassa ').id).toBe(FISCAL_PROVIDER.MULTIKASSA);
  });
});

describe('loadFiscalContext', () => {
  beforeEach(() => vi.clearAllMocks());

  it('passes store, register and options through and keeps capabilities as-is', async () => {
    const caps = { enabled: true, baseUrl: 'http://localhost:8080', printFiscalQr: false };
    loadFiscalCapabilities.mockResolvedValue(caps);

    const ctx = await loadFiscalContext(7, 3, { allowLoadFailureAsDisabled: true });

    expect(loadFiscalCapabilities).toHaveBeenCalledWith(7, 3, {
      allowLoadFailureAsDisabled: true,
    });
    expect(ctx.capabilities).toBe(caps);
    expect(ctx.provider.id).toBe(FISCAL_PROVIDER.MULTIKASSA);
  });

  it('propagates capability load errors unchanged', async () => {
    const err = Object.assign(new Error('load'), { code: 'FISCAL_CAPABILITIES_LOAD_FAILED' });
    loadFiscalCapabilities.mockRejectedValue(err);
    await expect(loadFiscalContext(1)).rejects.toBe(err);
  });
});

describe('multikassa provider adapter', () => {
  beforeEach(() => vi.clearAllMocks());

  it('delegates every operation with the same arguments', async () => {
    const provider = resolveFiscalProvider(FISCAL_PROVIDER.MULTIKASSA);
    const args = { capabilities: { enabled: true } };
    multikassa.fiscalizeSaleBeforeCommit.mockResolvedValue({ fiscalSign: 'S' });
    multikassa.fiscalizeRefundBeforeCommit.mockResolvedValue({ skipped: true });
    multikassa.fiscalizeShiftOperation.mockResolvedValue({ ok: true });
    multikassa.retryPendingFiscalOnPayload.mockResolvedValue({ retried: true });
    multikassa.isFiscalShiftAlreadyOpenError.mockReturnValue(true);

    await expect(provider.fiscalizeSale(args)).resolves.toEqual({ fiscalSign: 'S' });
    await expect(provider.fiscalizeRefund(args)).resolves.toEqual({ skipped: true });
    await expect(provider.fiscalizeShift({ ...args, kind: 'open' })).resolves.toEqual({ ok: true });
    await expect(provider.retryPending({ a: 1 }, { storeId: 2 })).resolves.toEqual({ retried: true });
    expect(provider.isShiftAlreadyOpenError('x')).toBe(true);

    expect(multikassa.fiscalizeSaleBeforeCommit).toHaveBeenCalledWith(args);
    expect(multikassa.fiscalizeRefundBeforeCommit).toHaveBeenCalledWith(args);
    expect(multikassa.fiscalizeShiftOperation).toHaveBeenCalledWith({ ...args, kind: 'open' });
    expect(multikassa.retryPendingFiscalOnPayload).toHaveBeenCalledWith({ a: 1 }, { storeId: 2 });
    expect(multikassa.isFiscalShiftAlreadyOpenError).toHaveBeenCalledWith('x');
  });
});

describe('wrapFiscalError', () => {
  it('keeps a fiscal load error instead of relabeling it Multikassa', () => {
    const err = Object.assign(new Error('load'), { code: 'FISCAL_CAPABILITIES_LOAD_FAILED' });
    expect(wrapFiscalError(err).code).toBe('FISCAL_CAPABILITIES_LOAD_FAILED');
  });

  it('falls back to Multikassa wrapping when provider is unknown', () => {
    const wrapped = wrapFiscalError(new Error('boom'));
    expect(wrapped.code).toBe('MULTIKASSA_FISCAL_FAILED');
    expect(multikassa.wrapMultikassaFiscalError).toHaveBeenCalled();
  });
});

describe('resolvePendingFiscalProvider', () => {
  it('treats legacy pending payloads without provider as Multikassa', () => {
    expect(resolvePendingFiscalProvider({ fiscal: { fiscalStatus: 'PENDING' } }).id).toBe(
      FISCAL_PROVIDER.MULTIKASSA,
    );
    expect(resolvePendingFiscalProvider(null).id).toBe(FISCAL_PROVIDER.MULTIKASSA);
  });
});

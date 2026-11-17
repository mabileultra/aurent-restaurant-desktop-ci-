import { describe, it, expect, vi } from 'vitest';
import {
  formatCatalogSyncAt,
  invalidatePosData,
  resolveOfflineStatusMessage,
} from './offlineStatusHelpers';

describe('offlineStatusHelpers', () => {
  const mockT = (key, opt) => (opt ? `${key}:${JSON.stringify(opt)}` : key);

  it('formatCatalogSyncAt formats date or returns null', () => {
    expect(formatCatalogSyncAt(null)).toBeNull();
    expect(formatCatalogSyncAt('2026-11-16T12:00:00.000Z')).toContain('16.11.2026');
  });

  it('invalidatePosData invalidates queries', () => {
    const qc = { invalidateQueries: vi.fn() };
    invalidatePosData(qc, 10);
    expect(qc.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['pos-categories'] });
    expect(qc.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['pos-products'] });
    expect(qc.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['cashier-shift'] });
    expect(qc.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['my-sales'] });
  });

  it('resolveOfflineStatusMessage returns correct message and tone when notAllowed', () => {
    const res = resolveOfflineStatusMessage({
      notAllowed: true,
      t: mockT,
    });
    expect(res.tone).toBe('warn');
    expect(res.message).toBe('offline.notAllowed');
    expect(res.shortLabel).toBe('offline.topbarDenied');
  });

  it('resolveOfflineStatusMessage returns online status when all good', () => {
    const res = resolveOfflineStatusMessage({
      notAllowed: false,
      desktopShell: false,
      visible: true,
      apiOnline: true,
      showOffline: false,
      showPending: false,
      catalogBusy: false,
      bootstrapReady: true,
      showCatalogStrip: true,
      catalogLabel: '16.11.2026 12:00',
      productCount: 150,
      t: mockT,
    });
    expect(res.tone).toBe('ok');
    expect(res.shortLabel).toBe('offline.topbarOnline');
  });
});

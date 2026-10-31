import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  PHARMACY_CATALOG_CHANGED_KEY,
  notifyPharmacyCatalogChanged,
  subscribePharmacyCatalogChanged,
} from './pharmacyCatalogChangedNotify';

describe('pharmacyCatalogChangedNotify', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('writes localStorage payload for other tabs', () => {
    const store = new Map();
    const localStorageMock = {
      setItem: (k, v) => store.set(k, v),
      getItem: (k) => store.get(k) ?? null,
      removeItem: (k) => store.delete(k),
    };
    vi.stubGlobal('window', {
      localStorage: localStorageMock,
      dispatchEvent: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    vi.stubGlobal('localStorage', localStorageMock);
    vi.stubGlobal('BroadcastChannel', undefined);

    notifyPharmacyCatalogChanged({ storeId: 30, reason: 'receipt-activate' });
    const raw = store.get(PHARMACY_CATALOG_CHANGED_KEY);
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw);
    expect(parsed.storeId).toBe(30);
    expect(parsed.reason).toBe('receipt-activate');
  });

  it('notifies same-tab listeners via CustomEvent', () => {
    const listeners = new Map();
    const localStorageMock = {
      setItem: vi.fn(),
      getItem: vi.fn(),
      removeItem: vi.fn(),
    };
    const win = {
      localStorage: localStorageMock,
      addEventListener: (type, fn) => {
        listeners.set(type, fn);
      },
      removeEventListener: (type) => {
        listeners.delete(type);
      },
      dispatchEvent: (event) => {
        listeners.get(event.type)?.(event);
        return true;
      },
    };
    vi.stubGlobal('window', win);
    vi.stubGlobal('localStorage', localStorageMock);
    vi.stubGlobal('BroadcastChannel', undefined);
    vi.stubGlobal('CustomEvent', class CustomEvent {
      constructor(type, init = {}) {
        this.type = type;
        this.detail = init.detail;
      }
    });

    const onChange = vi.fn();
    const stop = subscribePharmacyCatalogChanged(onChange);
    notifyPharmacyCatalogChanged({ storeId: 12, reason: 'receipt-line' });
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ storeId: 12, reason: 'receipt-line' }),
    );
    stop();
  });
});

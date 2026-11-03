import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { useFormDraft, sanitizeDraftData } from './useFormDraft';

describe('useFormDraft hook', () => {
  let mockStorage = {};

  beforeEach(() => {
    mockStorage = {};
    vi.stubGlobal('window', {
      sessionStorage: {
        getItem: (k) => mockStorage[k] || null,
        setItem: (k, v) => { mockStorage[k] = String(v); },
        removeItem: (k) => { delete mockStorage[k]; },
        clear: () => { mockStorage = {}; },
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('exports useFormDraft as a function', () => {
    expect(typeof useFormDraft).toBe('function');
  });

  it('safely handles clearDraft and storage operations', () => {
    const storageKey = 'test_key';
    window.sessionStorage.setItem(`draft_${storageKey}`, JSON.stringify({ name: 'Ali' }));
    expect(window.sessionStorage.getItem(`draft_${storageKey}`)).toContain('Ali');

    window.sessionStorage.removeItem(`draft_${storageKey}`);
    expect(window.sessionStorage.getItem(`draft_${storageKey}`)).toBeNull();
  });

  it('sanitizes password and PIN fields from draft data', () => {
    const dirtyData = {
      fullName: 'Sardor Rahim',
      username: 'sardor1',
      password: 'SecretPassword123!',
      confirmPassword: 'SecretPassword123!',
      pin: '1234',
      pinCode: '5678',
      role: 'CASHIER',
    };

    const clean = sanitizeDraftData(dirtyData);
    expect(clean.fullName).toBe('Sardor Rahim');
    expect(clean.username).toBe('sardor1');
    expect(clean.role).toBe('CASHIER');
    expect(clean.password).toBeUndefined();
    expect(clean.confirmPassword).toBeUndefined();
    expect(clean.pin).toBeUndefined();
    expect(clean.pinCode).toBeUndefined();
  });
});

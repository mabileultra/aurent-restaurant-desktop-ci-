import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const memory = new Map();
const sessionStorageMock = {
  getItem: (k) => (memory.has(k) ? memory.get(k) : null),
  setItem: (k, v) => { memory.set(k, String(v)); },
  removeItem: (k) => { memory.delete(k); },
  clear: () => { memory.clear(); },
};

const listeners = new Map();
function addListener(type, fn) {
  if (!listeners.has(type)) listeners.set(type, new Set());
  listeners.get(type).add(fn);
}
function removeListener(type, fn) {
  listeners.get(type)?.delete(fn);
}
function emit(type) {
  for (const fn of listeners.get(type) || []) fn();
}

vi.stubGlobal('sessionStorage', sessionStorageMock);
vi.stubGlobal('window', {
  location: { pathname: '/dashboard' },
  addEventListener: (type, fn) => addListener(type, fn),
  removeEventListener: (type, fn) => removeListener(type, fn),
  setTimeout: (...args) => globalThis.setTimeout(...args),
  clearTimeout: (...args) => globalThis.clearTimeout(...args),
  dispatchEvent: (ev) => { emit(ev.type); return true; },
});
vi.stubGlobal('document', {
  visibilityState: 'visible',
  addEventListener: (type, fn) => addListener(type, fn),
  removeEventListener: (type, fn) => removeListener(type, fn),
});

vi.mock('../src/store/authStore', () => {
  let token = 'tok';
  return {
    useAuthStore: {
      getState: () => ({ token }),
      __setToken: (v) => { token = v; },
    },
  };
});

vi.mock('../src/utils/authSessionExpiry', () => ({
  forceAuthReLogin: vi.fn(),
}));

vi.mock('../src/utils/authLogin', () => ({
  isAuthPage: () => false,
}));

vi.mock('../src/utils/publicAppPaths', () => ({
  isPublicAppPath: () => false,
}));

import { useAuthStore } from '../src/store/authStore';
import { forceAuthReLogin } from '../src/utils/authSessionExpiry';
import { AUTH_IDLE_MS, startAuthIdleWatch } from '../src/utils/authIdleTimeout';

describe('startAuthIdleWatch', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    memory.clear();
    listeners.clear();
    useAuthStore.__setToken('tok');
    forceAuthReLogin.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('logs out after 15 minutes idle', () => {
    const stop = startAuthIdleWatch({ idleMs: AUTH_IDLE_MS });
    vi.advanceTimersByTime(AUTH_IDLE_MS + 10);
    expect(forceAuthReLogin).toHaveBeenCalledTimes(1);
    stop();
  });

  it('activity resets idle timer', () => {
    const stop = startAuthIdleWatch({ idleMs: AUTH_IDLE_MS });
    vi.advanceTimersByTime(AUTH_IDLE_MS - 5_000);
    emit('pointerdown');
    vi.advanceTimersByTime(AUTH_IDLE_MS - 5_000);
    expect(forceAuthReLogin).not.toHaveBeenCalled();
    vi.advanceTimersByTime(10_000);
    expect(forceAuthReLogin).toHaveBeenCalledTimes(1);
    stop();
  });
});

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  isApiNetworkError,
  notifyNetworkOffline,
  notifyNetworkOnline,
  AURENT_NETWORK_OFFLINE_EVENT,
  AURENT_NETWORK_ONLINE_EVENT,
} from './apiNetworkError';

describe('apiNetworkError utility', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('detects network errors from error codes and messages', () => {
    expect(isApiNetworkError({ code: 'ERR_NETWORK' })).toBe(true);
    expect(isApiNetworkError({ code: 'ECONNABORTED' })).toBe(true);
    expect(isApiNetworkError({ code: 'ETIMEDOUT' })).toBe(true);
    expect(isApiNetworkError({ message: 'Network Error' })).toBe(true);
    expect(isApiNetworkError({ request: {}, response: null })).toBe(true);
    expect(isApiNetworkError({ response: { status: 400 } })).toBe(false);
    expect(isApiNetworkError({ code: 'ERR_CANCELED' })).toBe(false);
    expect(isApiNetworkError({ name: 'CanceledError' })).toBe(false);
  });

  it('detects gateway and proxy network outage responses (502, 503, 504, ENOTFOUND)', () => {
    expect(isApiNetworkError({ response: { status: 502 } })).toBe(true);
    expect(isApiNetworkError({ response: { status: 503 } })).toBe(true);
    expect(isApiNetworkError({ response: { status: 504 } })).toBe(true);
    expect(isApiNetworkError({ response: { status: 500, data: { error: 'NETWORK_UNREACHABLE' } } })).toBe(true);
    expect(isApiNetworkError({ response: { status: 500, data: 'Error: getaddrinfo ENOTFOUND aurent.uz' } })).toBe(true);
    expect(isApiNetworkError({ response: { status: 500, data: { message: 'Database constraint failed' } } })).toBe(false);
  });

  it('detects network errors when navigator is offline', () => {
    vi.stubGlobal('navigator', { onLine: false });
    expect(isApiNetworkError(null)).toBe(true);
  });

  it('dispatches custom offline and online window events when window is available', () => {
    const offlineSpy = vi.fn();
    const onlineSpy = vi.fn();

    const listeners = {};
    const mockWindow = {
      addEventListener: vi.fn((event, cb) => {
        listeners[event] = cb;
      }),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn((event) => {
        if (listeners[event.type]) {
          listeners[event.type](event);
        }
      }),
    };

    vi.stubGlobal('window', mockWindow);

    mockWindow.addEventListener(AURENT_NETWORK_OFFLINE_EVENT, offlineSpy);
    mockWindow.addEventListener(AURENT_NETWORK_ONLINE_EVENT, onlineSpy);

    notifyNetworkOffline({ message: 'No route to host' });
    expect(mockWindow.dispatchEvent).toHaveBeenCalled();

    notifyNetworkOnline();
    expect(mockWindow.dispatchEvent).toHaveBeenCalledTimes(2);
  });
});

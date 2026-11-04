import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { registerPwa } from './registerPwa';

describe('registerPwa', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('does nothing when navigator has no serviceWorker support', () => {
    const registerMock = vi.fn();
    vi.stubGlobal('navigator', {});
    vi.stubGlobal('window', { isSecureContext: true, location: { hostname: 'aurent.uz' } });
    registerPwa();
    expect(registerMock).not.toHaveBeenCalled();
  });

  it('registers service worker when secure context and serviceWorker available', () => {
    const registerMock = vi.fn().mockResolvedValue({});
    const addEventListenerMock = vi.fn((event, cb) => {
      if (event === 'load') cb();
    });

    vi.stubGlobal('navigator', {
      serviceWorker: {
        register: registerMock,
      },
    });
    vi.stubGlobal('window', {
      isSecureContext: true,
      location: { hostname: 'aurent.uz' },
      addEventListener: addEventListenerMock,
    });

    registerPwa();
    expect(addEventListenerMock).toHaveBeenCalledWith('load', expect.any(Function));
    expect(registerMock).toHaveBeenCalledWith('/sw.js');
  });
});

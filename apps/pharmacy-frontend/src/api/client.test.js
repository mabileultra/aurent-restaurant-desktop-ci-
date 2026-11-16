import { beforeEach, describe, expect, it, vi } from 'vitest';
import axios, { AxiosHeaders } from 'axios';

const mockAuthState = {
  token: null,
  user: null,
  setAuth: vi.fn(),
  logout: vi.fn(),
};

const forceAuthReLoginMock = vi.fn();
const isPublicAppPathMock = vi.fn();

vi.mock('../store/authStore', () => ({
  useAuthStore: {
    getState: () => mockAuthState,
  },
}));

vi.mock('../config/env', () => ({
  getApiBaseUrl: () => 'http://localhost:8080/api/v1',
}));

vi.mock('../utils/authSessionExpiry', () => ({
  forceAuthReLogin: (...args) => forceAuthReLoginMock(...args),
}));

vi.mock('../utils/publicAppPaths', () => ({
  isPublicAppPath: (...args) => isPublicAppPathMock(...args),
}));

vi.mock('../utils/apiNetworkError', () => ({
  isApiNetworkError: (err) => !err?.response && Boolean(err?.message),
  notifyNetworkOffline: vi.fn(),
  notifyNetworkOnline: vi.fn(),
}));

vi.mock('../services/offline/desktopOfflineBridge', () => ({
  isDesktopOfflineBridge: () => false,
}));

vi.mock('../store/connectivityStore', () => ({
  markApiUnreachable: vi.fn(),
  refreshConnectivityStatus: vi.fn(),
}));

import { api } from './client';

function makeJwt(expOffsetSec = 600) {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + expOffsetSec }));
  return `${header}.${payload}.sig`;
}

function makeHttpError(config, status, data = {}) {
  return Object.assign(new Error(`HTTP ${status}`), {
    config,
    response: { status, data, config, headers: {} },
    isAxiosError: true,
  });
}

beforeEach(() => {
  vi.restoreAllMocks();
  mockAuthState.token = makeJwt(600);
  mockAuthState.user = { id: 1, role: 'ADMIN', companyLoginCode: 'APTEKA' };
  mockAuthState.setAuth = vi.fn((newToken, newUser) => {
    mockAuthState.token = newToken;
    mockAuthState.user = newUser;
  });
  mockAuthState.logout = vi.fn(() => {
    mockAuthState.token = null;
    mockAuthState.user = null;
  });
  forceAuthReLoginMock.mockReset();
  isPublicAppPathMock.mockReset();
  isPublicAppPathMock.mockReturnValue(false);
  globalThis.window = { location: { pathname: '/dashboard' } };
});

describe('api client 401 single-flight interceptor', () => {
  it('параллельные 401 выполняют один /auth/refresh и повторяют все запросы с новым токеном', async () => {
    const oldToken = mockAuthState.token;
    const newToken = makeJwt(1200);
    let resolveRefresh;

    const refreshSpy = vi.spyOn(axios, 'post').mockImplementation(
      () => new Promise((resolve) => {
        resolveRefresh = resolve;
      }),
    );

    const adapterSpy = vi.fn(async (config) => {
      const auth = config.headers?.get?.('Authorization') ?? config.headers?.Authorization;
      if (auth === `Bearer ${oldToken}`) {
        throw makeHttpError(config, 401);
      }
      return {
        data: { ok: true, url: config.url, auth },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      };
    });
    api.defaults.adapter = adapterSpy;

    const req1 = api.get('/products');
    const req2 = api.get('/stores');
    const req3 = api.get('/reports/summary');

    await vi.waitFor(() => {
      expect(refreshSpy).toHaveBeenCalledTimes(1);
    });

    resolveRefresh({ data: { token: newToken, id: 1, role: 'ADMIN' } });

    const [res1, res2, res3] = await Promise.all([req1, req2, req3]);
    expect(refreshSpy).toHaveBeenCalledTimes(1);
    expect(res1.data).toEqual({ ok: true, url: '/products', auth: `Bearer ${newToken}` });
    expect(res2.data).toEqual({ ok: true, url: '/stores', auth: `Bearer ${newToken}` });
    expect(res3.data).toEqual({ ok: true, url: '/reports/summary', auth: `Bearer ${newToken}` });
  });

  it('не вызывает /auth/refresh повторно, если 401 пришёл уже после обновления токена в store', async () => {
    const staleToken = makeJwt(300);
    const freshToken = makeJwt(1200);
    mockAuthState.token = freshToken;

    const refreshSpy = vi.spyOn(axios, 'post');
    api.defaults.adapter = vi.fn(async (config) => {
      if (!config._retry) {
        const headers = new AxiosHeaders(config.headers);
        headers.set('Authorization', `Bearer ${staleToken}`);
        throw makeHttpError({ ...config, headers }, 401);
      }
      const auth = config.headers?.get?.('Authorization') ?? config.headers?.Authorization;
      return { data: { auth }, status: 200, statusText: 'OK', headers: {}, config };
    });

    const res = await api.get('/finance/dashboard');
    expect(refreshSpy).not.toHaveBeenCalled();
    expect(res.data.auth).toBe(`Bearer ${freshToken}`);
  });

  it('при 400 на /auth/refresh сбрасывает сессию один раз и отклоняет параллельные запросы', async () => {
    let rejectRefresh;
    vi.spyOn(axios, 'post').mockImplementation(
      () => new Promise((_, reject) => {
        rejectRefresh = reject;
      }),
    );

    api.defaults.adapter = vi.fn(async (config) => {
      throw makeHttpError(config, 401);
    });

    const p1 = api.get('/products');
    const p2 = api.get('/stores');

    await vi.waitFor(() => {
      expect(rejectRefresh).toBeTypeOf('function');
    });

    rejectRefresh({ response: { status: 400, data: { message: 'Invalid or expired token' } } });

    await expect(p1).rejects.toThrow('HTTP 401');
    await expect(p2).rejects.toThrow('HTTP 401');
    expect(forceAuthReLoginMock).toHaveBeenCalledTimes(1);
  });

  it('не вызывает forceAuthReLogin при 503 во время /auth/refresh и не уходит в цикл при повторном 401', async () => {
    const refreshSpy = vi.spyOn(axios, 'post').mockRejectedValue({ response: { status: 503 } });

    api.defaults.adapter = vi.fn(async (config) => {
      throw makeHttpError(config, 401);
    });

    await expect(api.get('/products')).rejects.toThrow('HTTP 401');
    expect(refreshSpy).toHaveBeenCalledTimes(1);
    expect(forceAuthReLoginMock).not.toHaveBeenCalled();

    const newToken = makeJwt(1200);
    refreshSpy.mockResolvedValueOnce({ data: { token: newToken, id: 1, role: 'ADMIN' } });

    await expect(api.get('/products')).rejects.toThrow('HTTP 401');
    expect(refreshSpy).toHaveBeenCalledTimes(2);
    expect(api.defaults.adapter).toHaveBeenCalledTimes(3);
  });
});


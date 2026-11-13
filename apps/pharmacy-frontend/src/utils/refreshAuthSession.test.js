import { beforeEach, describe, expect, it, vi } from 'vitest';
import axios from 'axios';

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

vi.mock('./authSessionExpiry', () => ({
  forceAuthReLogin: (...args) => forceAuthReLoginMock(...args),
}));

vi.mock('./publicAppPaths', () => ({
  isPublicAppPath: (...args) => isPublicAppPathMock(...args),
}));

import { refreshAuthSession } from './refreshAuthSession';
import { syncAuthSession } from './syncAuthSession';

function makeJwt(expOffsetSec = 600) {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + expOffsetSec }));
  return `${header}.${payload}.sig`;
}

beforeEach(() => {
  vi.restoreAllMocks();
  mockAuthState.token = makeJwt(600);
  mockAuthState.user = { id: 10, role: 'PHARMACIST', companyLoginCode: 'APTEKA' };
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

describe('refreshAuthSession', () => {
  it('выполняет только один POST /auth/refresh при параллельных вызовах (single-flight)', async () => {
    const oldToken = mockAuthState.token;
    const newToken = makeJwt(1200);
    let resolvePost;
    const postSpy = vi.spyOn(axios, 'post').mockImplementation(
      () => new Promise((resolve) => {
        resolvePost = resolve;
      }),
    );

    const p1 = refreshAuthSession({ expectedToken: oldToken });
    const p2 = refreshAuthSession({ expectedToken: oldToken });
    const p3 = syncAuthSession();

    expect(postSpy).toHaveBeenCalledTimes(1);

    resolvePost({
      data: {
        token: newToken,
        id: 10,
        role: 'ADMIN',
        allowedModules: ['dashboard', 'reportsSalesDaily'],
      },
    });

    const [r1, r2, r3] = await Promise.all([p1, p2, p3]);
    expect(r1.token).toBe(newToken);
    expect(r2.token).toBe(newToken);
    expect(r3.role).toBe('ADMIN');
    expect(mockAuthState.setAuth).toHaveBeenCalledTimes(1);
    expect(mockAuthState.setAuth).toHaveBeenCalledWith(newToken, {
      id: 10,
      role: 'ADMIN',
      companyLoginCode: 'APTEKA',
      allowedModules: ['dashboard', 'reportsSalesDaily'],
    });
  });

  it('не шлёт повторный /auth/refresh, если токен в store уже обновлён другим запросом', async () => {
    const staleToken = makeJwt(100);
    const freshToken = makeJwt(1200);
    mockAuthState.token = freshToken;

    const postSpy = vi.spyOn(axios, 'post');
    const res = await refreshAuthSession({ expectedToken: staleToken });

    expect(postSpy).not.toHaveBeenCalled();
    expect(res.token).toBe(freshToken);
    expect(res.refreshed).toBe(false);
  });

  it('вызывает forceAuthReLogin ровно один раз при отклонении refresh сервером (400/401/403)', async () => {
    const oldToken = mockAuthState.token;
    let rejectPost;
    vi.spyOn(axios, 'post').mockImplementation(
      () => new Promise((_, reject) => {
        rejectPost = reject;
      }),
    );

    const p1 = refreshAuthSession({ expectedToken: oldToken });
    const p2 = refreshAuthSession({ expectedToken: oldToken });

    rejectPost({ response: { status: 400, data: { message: 'Invalid or expired token' } } });

    await expect(p1).rejects.toBeDefined();
    await expect(p2).rejects.toBeDefined();
    expect(forceAuthReLoginMock).toHaveBeenCalledTimes(1);
  });

  it('на публичном пути делает тихий logout вместо forceAuthReLogin', async () => {
    isPublicAppPathMock.mockReturnValue(true);
    globalThis.window = { location: { pathname: '/login' } };

    vi.spyOn(axios, 'post').mockRejectedValue({ response: { status: 401 } });

    await expect(refreshAuthSession()).rejects.toBeDefined();
    expect(mockAuthState.logout).toHaveBeenCalledTimes(1);
    expect(forceAuthReLoginMock).not.toHaveBeenCalled();
  });

  it('не разлогинивает при временной сетевой ошибке или 503 во время /auth/refresh', async () => {
    vi.spyOn(axios, 'post').mockRejectedValue({ response: { status: 503 } });

    await expect(refreshAuthSession()).rejects.toBeDefined();
    expect(forceAuthReLoginMock).not.toHaveBeenCalled();
    expect(mockAuthState.logout).not.toHaveBeenCalled();

    vi.spyOn(axios, 'post').mockRejectedValue(new Error('Network Error'));

    await expect(refreshAuthSession()).rejects.toThrow('Network Error');
    expect(forceAuthReLoginMock).not.toHaveBeenCalled();
    expect(mockAuthState.logout).not.toHaveBeenCalled();
  });

  it('не перезаписывает сессию, если пользователь разлогинился во время ожидания /auth/refresh', async () => {
    const newToken = makeJwt(1200);
    let resolvePost;
    vi.spyOn(axios, 'post').mockImplementation(
      () => new Promise((resolve) => {
        resolvePost = resolve;
      }),
    );

    const p = refreshAuthSession();
    mockAuthState.logout();

    resolvePost({ data: { token: newToken, id: 10, role: 'ADMIN' } });

    await expect(p).rejects.toThrow('Session cleared during token refresh');
    expect(mockAuthState.setAuth).not.toHaveBeenCalled();
    expect(mockAuthState.token).toBeNull();
  });
});


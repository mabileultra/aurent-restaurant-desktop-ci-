import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearMkFiscalPrinterCache,
  ensureMkFiscalPrinter,
  invalidateMkFiscalPrinterCache,
} from './ensureMkFiscalPrinter';
import {
  clearMultikassaHttpCaches,
  getPrintersWithFallback,
  multikassaHttpRequest,
} from './multikassaHttpClient';
import { runMultikassaOperation } from './runMultikassaOperation';

describe('Multikassa printer cache and timeouts', () => {
  const originalWindow = globalThis.window;

  beforeEach(() => {
    clearMkFiscalPrinterCache();
    clearMultikassaHttpCaches();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (originalWindow === undefined) {
      delete globalThis.window;
    } else {
      globalThis.window = originalWindow;
    }
  });

  it('caches silent printer check within TTL, dedupes concurrent calls, and supports forceRefresh', async () => {
    let now = 10_000;
    const getPrintersWithFallbackMock = vi.fn(async () => ({
      data: {
        selected: '(не печатать)',
        printers: ['(не печатать)', 'XP-80C'],
      },
    }));
    const selectPrinterMock = vi.fn(async () => ({ ok: true }));

    const opts = {
      useCache: true,
      now: () => now,
      getPrintersWithFallback: getPrintersWithFallbackMock,
      selectPrinter: selectPrinterMock,
    };

    const [a, b] = await Promise.all([
      ensureMkFiscalPrinter('http://127.0.0.1:8080', opts),
      ensureMkFiscalPrinter('http://127.0.0.1:8080/', opts),
    ]);

    expect(getPrintersWithFallbackMock).toHaveBeenCalledTimes(1);
    expect(selectPrinterMock).not.toHaveBeenCalled();
    expect(a.silent).toBe(true);
    expect(b.silent).toBe(true);

    now += 60_000;
    const cached = await ensureMkFiscalPrinter('http://127.0.0.1:8080', opts);
    expect(getPrintersWithFallbackMock).toHaveBeenCalledTimes(1);
    expect(cached.silent).toBe(true);

    await ensureMkFiscalPrinter('http://127.0.0.1:8080', { ...opts, forceRefresh: true });
    expect(getPrintersWithFallbackMock).toHaveBeenCalledTimes(2);

    invalidateMkFiscalPrinterCache('http://127.0.0.1:8080');
    await ensureMkFiscalPrinter('http://127.0.0.1:8080', opts);
    expect(getPrintersWithFallbackMock).toHaveBeenCalledTimes(3);
  });

  it('does not cache empty printer list response', async () => {
    let calls = 0;
    const getPrintersWithFallbackMock = vi.fn(async () => {
      calls += 1;
      if (calls === 1) return { data: { printers: [] } };
      return { data: { printers: ['(не печатать)'] } };
    });
    const selectPrinterMock = vi.fn(async () => ({ ok: true }));

    const opts = {
      useCache: true,
      getPrintersWithFallback: getPrintersWithFallbackMock,
      selectPrinter: selectPrinterMock,
    };

    const first = await ensureMkFiscalPrinter('http://127.0.0.1:8080', opts);
    expect(first.selected).toBe('');

    const second = await ensureMkFiscalPrinter('http://127.0.0.1:8080', opts);
    expect(second.silent).toBe(true);
    expect(getPrintersWithFallbackMock).toHaveBeenCalledTimes(2);
    expect(selectPrinterMock).toHaveBeenCalledTimes(1);
  });

  it('getPrintersWithFallback remembers working endpoint path and clears on 404', async () => {
    let mode = 'second_works';
    const requestedUrls = [];
    globalThis.window = {
      location: { protocol: 'http:' },
      desktopCashier: {
        isDesktop: true,
        multikassaRequest: vi.fn(async ({ url }) => {
          requestedUrls.push(url);
          if (mode === 'second_works') {
            if (url.endsWith('/api/v1/devices/printers')) {
              return { ok: false, status: 404, data: { message: 'Not found' } };
            }
            if (url.endsWith('/api/v1/printers')) {
              return { ok: true, status: 200, data: { printers: ['(не печатать)'] } };
            }
          }
          if (url.endsWith('/api/v1/printers')) {
            return { ok: false, status: 404, data: { message: 'Moved' } };
          }
          return { ok: true, status: 200, data: { printers: ['PDF'] } };
        }),
      },
    };

    const first = await getPrintersWithFallback('http://127.0.0.1:8080');
    expect(first.path).toBe('/api/v1/printers');
    expect(requestedUrls).toEqual([
      'http://127.0.0.1:8080/api/v1/devices/printers',
      'http://127.0.0.1:8080/api/v1/printers',
    ]);

    requestedUrls.length = 0;
    const second = await getPrintersWithFallback('http://127.0.0.1:8080');
    expect(second.path).toBe('/api/v1/printers');
    expect(requestedUrls).toEqual(['http://127.0.0.1:8080/api/v1/printers']);

    mode = 'first_works';
    requestedUrls.length = 0;
    const third = await getPrintersWithFallback('http://127.0.0.1:8080');
    expect(third.path).toBe('/api/v1/devices/printers');
    expect(requestedUrls).toEqual([
      'http://127.0.0.1:8080/api/v1/printers',
      'http://127.0.0.1:8080/api/v1/devices/printers',
    ]);
  });

  it('multikassaHttpRequest passes timeoutMs to desktop proxy and aborts slow browser fetch', async () => {
    const proxySpy = vi.fn(async () => ({ ok: true, status: 200, data: { ok: true } }));
    globalThis.window = {
      location: { protocol: 'http:' },
      desktopCashier: { isDesktop: true, multikassaRequest: proxySpy },
    };

    await multikassaHttpRequest({
      baseUrl: 'http://127.0.0.1:8080',
      method: 'POST',
      path: '/api/v1/operations',
      body: { test: 1 },
    });
    expect(proxySpy).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'POST',
        url: 'http://127.0.0.1:8080/api/v1/operations',
        timeoutMs: 25_000,
      }),
    );

    globalThis.window = { location: { protocol: 'http:' } };
    vi.stubGlobal(
      'fetch',
      vi.fn((_url, init) => new Promise((_resolve, reject) => {
        init.signal.addEventListener('abort', () => {
          const err = new Error('aborted');
          err.name = 'AbortError';
          reject(err);
        });
      })),
    );

    await expect(
      multikassaHttpRequest({
        baseUrl: 'http://127.0.0.1:8080',
        method: 'GET',
        path: '/api/v1/devices/printers',
        timeoutMs: 20,
      }),
    ).rejects.toMatchObject({ code: 'MULTIKASSA_TIMEOUT' });
  });

  it('runMultikassaOperation reuses cached printer across sales and invalidates on printer error', async () => {
    let failOperationWithPrinterErr = false;
    const calls = [];
    globalThis.window = {
      location: { protocol: 'http:' },
      desktopCashier: {
        isDesktop: true,
        multikassaRequest: vi.fn(async ({ method, url }) => {
          calls.push(`${method} ${url}`);
          if (url.endsWith('/api/v1/devices/printers')) {
            return {
              ok: true,
              status: 200,
              data: { selected: '(не печатать)', printers: ['(не печатать)'] },
            };
          }
          if (url.endsWith('/api/v1/operations') && method === 'POST') {
            if (failOperationWithPrinterErr) {
              return { ok: false, status: 500, data: { message: 'Принтер не выбран' } };
            }
            return {
              ok: true,
              status: 200,
              data: {
                status: 'fiscalized',
                QRCodeURL: 'https://ofd.soliq.uz/check?t=1&r=1&c=1&s=1',
                FiscalSign: 'FS1',
                ReceiptSeq: 1,
                TerminalID: 'EP0001',
              },
            };
          }
          return { ok: true, status: 200, data: {} };
        }),
      },
    };

    await runMultikassaOperation('http://127.0.0.1:8080', { type: 'sale' });
    await runMultikassaOperation('http://127.0.0.1:8080', { type: 'sale' });

    const printerLookups = calls.filter((c) => c.includes('/devices/printers'));
    expect(printerLookups).toHaveLength(1);

    failOperationWithPrinterErr = true;
    await expect(runMultikassaOperation('http://127.0.0.1:8080', { type: 'sale' })).rejects.toThrow(
      /Принтер/,
    );

    failOperationWithPrinterErr = false;
    await runMultikassaOperation('http://127.0.0.1:8080', { type: 'sale' });
    const printerLookupsAfterInvalidation = calls.filter((c) => c.includes('/devices/printers'));
    expect(printerLookupsAfterInvalidation).toHaveLength(2);
  });
});


const assert = require('node:assert/strict');
const test = require('node:test');

const {
  createPrinterResolver,
  LIST_TTL_MS,
  EMPTY_LIST_TTL_MS,
} = require('../electron/printers/resolve.cjs');
const { runEscposPrintJob } = require('../electron/cashier-receipt-escpos/escpos-job.cjs');
const {
  createRawPrintRunner,
  WORKER_RETRY_COOLDOWN_MS,
  WorkerUnavailableError,
} = require('../electron/printers/win-raw-print.cjs');
const { multikassaRequest } = require('../electron/multikassa/multikassaProxy.js');

test('resolvePrinterByKind returns saved printer immediately when promptIfMissing is false', async () => {
  let getPrintersCalls = 0;
  const resolver = createPrinterResolver({
    readPrinterSettings: () => ({ receiptPrinterName: 'Xprinter XP-80C' }),
    getMainWindow: () => ({
      isDestroyed: () => false,
      webContents: {
        getPrintersAsync: async () => {
          getPrintersCalls += 1;
          return [{ name: 'Xprinter XP-80C', isDefault: true }];
        },
      },
    }),
  });

  const resolved = await resolver.resolvePrinterByKind('receipt', { promptIfMissing: false });
  assert.equal(resolved, 'Xprinter XP-80C');
  assert.equal(getPrintersCalls, 0);
});

test('listSystemPrinters caches non-empty list for LIST_TTL_MS and supports forceRefresh', async () => {
  let now = 1_000_000;
  let getPrintersCalls = 0;
  const resolver = createPrinterResolver({
    now: () => now,
    getMainWindow: () => ({
      isDestroyed: () => false,
      webContents: {
        getPrintersAsync: async () => {
          getPrintersCalls += 1;
          return [{ name: `Printer-${getPrintersCalls}`, isDefault: true }];
        },
      },
    }),
  });

  const [first, concurrent] = await Promise.all([
    resolver.listSystemPrinters(),
    resolver.listSystemPrinters(),
  ]);
  assert.equal(getPrintersCalls, 1);
  assert.deepEqual(first, concurrent);

  now += LIST_TTL_MS - 1000;
  const cached = await resolver.listSystemPrinters();
  assert.equal(getPrintersCalls, 1);
  assert.equal(cached[0].name, 'Printer-1');

  const forced = await resolver.listSystemPrinters({ forceRefresh: true });
  assert.equal(getPrintersCalls, 2);
  assert.equal(forced[0].name, 'Printer-2');

  now += LIST_TTL_MS + 1;
  const expired = await resolver.listSystemPrinters();
  assert.equal(getPrintersCalls, 3);
  assert.equal(expired[0].name, 'Printer-3');
});

test('listSystemPrinters refreshes empty list after EMPTY_LIST_TTL_MS', async () => {
  let now = 50_000;
  let calls = 0;
  const resolver = createPrinterResolver({
    now: () => now,
    getMainWindow: () => ({
      isDestroyed: () => false,
      webContents: {
        getPrintersAsync: async () => {
          calls += 1;
          return calls === 1 ? [] : [{ name: 'USB-Thermal', isDefault: true }];
        },
      },
    }),
  });

  assert.deepEqual(await resolver.listSystemPrinters(), []);
  assert.equal(calls, 1);

  now += EMPTY_LIST_TTL_MS + 1;
  const after = await resolver.listSystemPrinters();
  assert.equal(calls, 2);
  assert.equal(after[0].name, 'USB-Thermal');
});

test('runEscposPrintJob skips checkConnected probe on win32', async () => {
  let checkCalls = 0;
  let executeCalls = 0;

  const result = await runEscposPrintJob({
    jobType: 'sale_receipt',
    payload: { locale: 'ru' },
    platform: 'win32',
    validatePayload: () => {},
    resolvePrinterName: async () => 'XP-80C',
    createPrinter: () => ({ id: 'mock' }),
    buildOnPrinter: async () => {},
    checkConnected: async () => {
      checkCalls += 1;
      return true;
    },
    executePrint: async () => {
      executeCalls += 1;
    },
  });

  assert.equal(result.ok, true);
  assert.equal(checkCalls, 0);
  assert.equal(executeCalls, 1);
});

test('runEscposPrintJob runs checkConnected on non-win32 for sale_receipt', async () => {
  let checkCalls = 0;
  await assert.rejects(
    () =>
      runEscposPrintJob({
        jobType: 'sale_receipt',
        payload: { locale: 'ru' },
        platform: 'linux',
        validatePayload: () => {},
        resolvePrinterName: async () => 'XP-80C',
        createPrinter: () => ({ id: 'mock' }),
        buildOnPrinter: async () => {},
        checkConnected: async () => {
          checkCalls += 1;
          return false;
        },
        executePrint: async () => {},
      }),
    (err) => err?.code === 'NOT_CONNECTED',
  );
  assert.equal(checkCalls, 1);
});

test('createRawPrintRunner retries worker after start timeout cooldown instead of disabling forever', async () => {
  let now = 100_000;
  let spawnCalls = 0;
  let onceCalls = 0;
  let workerWrites = 0;

  const runner = createRawPrintRunner({
    isWin: true,
    now: () => now,
    printRawBufferOnce: async () => {
      onceCalls += 1;
      return { ok: true };
    },
    spawnWorker: () => {
      spawnCalls += 1;
      if (spawnCalls === 1) {
        return {
          dead: false,
          pending: new Map(),
          ready: Promise.reject(new WorkerUnavailableError('RAW worker start timeout')),
          proc: { kill: () => {}, stdin: { write: () => {} } },
        };
      }
      const pending = new Map();
      return {
        dead: false,
        pending,
        ready: Promise.resolve(),
        proc: {
          kill: () => {},
          stdin: {
            write: (line) => {
              workerWrites += 1;
              const id = line.split('\t')[0];
              const job = pending.get(id);
              if (job) {
                pending.delete(id);
                clearTimeout(job.timer);
                job.resolve({ ok: true });
              }
            },
          },
        },
      };
    },
  });

  const payload = Buffer.from('1234567890');
  await runner.printRawBuffer('XP-80C', payload);
  assert.equal(spawnCalls, 1);
  assert.equal(onceCalls, 1);

  await runner.printRawBuffer('XP-80C', payload);
  assert.equal(spawnCalls, 1);
  assert.equal(onceCalls, 2);

  now += WORKER_RETRY_COOLDOWN_MS + 1;
  await runner.printRawBuffer('XP-80C', payload);
  assert.equal(spawnCalls, 2);
  assert.equal(workerWrites, 1);
  assert.equal(onceCalls, 2);
});

test('multikassaRequest returns timeout response when fetch aborts on deadline', async () => {
  const result = await multikassaRequest(
    { method: 'GET', url: 'http://127.0.0.1:8080/api/v1/devices/printers', timeoutMs: 25 },
    {
      fetch: (_url, init) =>
        new Promise((_resolve, reject) => {
          init.signal.addEventListener('abort', () => {
            const err = new Error('aborted');
            err.name = 'AbortError';
            reject(err);
          });
        }),
    },
  );

  assert.equal(result.ok, false);
  assert.equal(result.status, 0);
  assert.equal(result.data.error, 'timeout');
});


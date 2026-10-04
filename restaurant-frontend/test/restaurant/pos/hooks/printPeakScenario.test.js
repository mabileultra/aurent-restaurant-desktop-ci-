/**
 * Peak-hour scenario for the real venue layout: one laptop runs the print relay, Kassa is the main
 * printer (bills, drinks, cashier receipts) and Oshxona / Shashlik / Salat hang off LAN cables.
 * Kitchen board is off, so every send makes one CATEGORY_BATCH slip per station.
 *
 * The real hook + executeRestaurantPrintJob + printer lanes run against an in-memory twin of the
 * claim SQL (per-printer cap, busy printers, 45 s stale reclaim, 5/20 min expiry) and fake Windows
 * printers with their own spool queue and physical print time. Fake timers: minutes take seconds.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({ server: null, cleanups: [], offline: false, toasts: [] }));

vi.mock('react', () => ({
  useRef: (value) => ({ current: value }),
  useEffect: (fn) => {
    const cleanup = fn();
    if (typeof cleanup === 'function') h.cleanups.push(cleanup);
  },
}));
vi.mock('react-hot-toast', () => ({
  default: { error: (msg) => h.toasts.push(String(msg)), success: () => {} },
}));
vi.mock('../../../../src/api/client', () => ({
  api: {
    get: (url) => h.server.httpGet(url),
    post: () => Promise.reject(new Error('unexpected POST')),
  },
}));
vi.mock('../../../../src/restaurant/api/print.api', () => ({
  rstPrintApi: {
    claimPending: (_storeId, body) => h.server.claim(body),
    pollPending: () => Promise.reject(new Error('legacy poll is off in this scenario')),
    acknowledge: (_storeId, ids) => h.server.ack(ids),
    release: (_storeId, ids) => h.server.release(ids),
  },
}));

const STALE_MS = 45_000;
const BILL_TTL_MS = 5 * 60_000;
const SLIP_TTL_MS = 20 * 60_000;
const CLAIM_BATCH = 25;
const RTT_MS = 40;
const WORKER_TIMEOUT_MS = 10_000;

const KASSA = 'Kassa';
const STATIONS = ['Oshxona', 'Shashlik', 'Salat', KASSA];
const PRINTERS = [KASSA, 'Oshxona', 'Shashlik', 'Salat'];
const TITLE = { Oshxona: 'Горячее', Shashlik: 'Шашлык', Salat: 'Салаты', Kassa: 'Напитки' };

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const lower = (s) => String(s || '').trim().toLowerCase();
const networkDown = () => Promise.reject(Object.assign(new Error('Network Error'), { code: 'ERR_NETWORK' }));

function seeded(seed) {
  let s = seed;
  return () => {
    s = (s * 1_103_515_245 + 12_345) % 2 ** 31;
    return s / 2 ** 31;
  };
}

/** In-memory twin of RestaurantPrintJobRepository + PrintJobServiceImpl claim path. */
function createServer() {
  const jobs = new Map();
  const orders = new Map();
  let seq = 0;
  let orderSeq = 0;
  const stats = { claimCalls: 0, staleReclaims: 0, releases: 0, expired: 0, lostAcks: 0 };

  const offlineGuard = async () => {
    await sleep(RTT_MS / 2);
    if (h.offline) throw new Error('Network Error');
  };

  const add = (kind, makePayload) => {
    const id = `job-${++seq}`;
    const job = {
      id,
      seq,
      kind,
      status: 'PENDING',
      createdAt: Date.now(),
      claimedAt: null,
      expired: false,
      payload: null,
      printer: null,
    };
    job.payload = makePayload(id);
    job.printer = job.payload.printerName ? lower(job.payload.printerName) : null;
    jobs.set(id, job);
    return job;
  };

  return {
    jobs,
    stats,
    /** Admin category → printer mapping served at /menu-categories. */
    categoryPrinters: {},
    /** Waiter presses «send»: one CATEGORY_BATCH per station, like PrintJobPublisher.enqueueCategoryBatches. */
    sendOrder(stationLines, { printerOverride = {} } = {}) {
      const orderId = `order-${++orderSeq}`;
      orders.set(orderId, { id: orderId });
      return Object.entries(stationLines).map(([station, lineCount]) => add('CATEGORY_BATCH', (id) => ({
        orderId,
        printerName: printerOverride[station] || station,
        title: TITLE[station] || station,
        header: `Зал · Стол ${orderSeq}`,
        waiterUserId: null,
        lines: Array.from({ length: lineCount }, (_, i) => ({
          name: i === 0 ? `${id} блюдо` : `блюдо ${i + 1}`,
          quantity: 1,
          portionText: null,
          note: null,
          modifiers: [],
        })),
      })));
    },
    requestBill() {
      const orderId = `order-${++orderSeq}`;
      const job = add('GUEST_BILL', () => ({ orderId }));
      orders.set(orderId, { id: orderId, billJobId: job.id });
      return job;
    },
    async httpGet(url) {
      await offlineGuard();
      if (/\/menu-categories$/.test(String(url))) {
        return {
          data: STATIONS.map((station) => ({
            name: TITLE[station],
            autoPrint: true,
            printPrinterName: this.categoryPrinters[station] || station,
          })),
        };
      }
      const match = String(url).match(/^\/rst\/orders\/(.+)$/);
      if (!match) throw new Error(`404 ${url}`);
      const order = orders.get(match[1]);
      const marker = order?.billJobId || match[1];
      return {
        data: {
          id: match[1],
          storeId: 1,
          tableCode: '5',
          orderNo: marker,
          items: Array.from({ length: 8 }, (_, i) => ({
            name: i === 0 ? `${marker} плов` : `позиция ${i + 1}`,
            quantity: 1,
            unitPrice: 50_000,
            lineTotal: 50_000,
          })),
          subtotal: 400_000,
          total: 400_000,
        },
      };
    },
    async claim(body) {
      await offlineGuard();
      stats.claimCalls += 1;
      const now = Date.now();
      for (const job of jobs.values()) {
        if (job.status === 'CLAIMED' && now - job.claimedAt > STALE_MS) {
          job.status = 'PENDING';
          job.claimedAt = null;
          stats.staleReclaims += 1;
        }
      }
      for (const job of jobs.values()) {
        const ttl = job.kind === 'GUEST_BILL' ? BILL_TTL_MS : SLIP_TTL_MS;
        if (job.status === 'PENDING' && now - job.createdAt > ttl) {
          job.status = 'DONE';
          job.expired = true;
          stats.expired += 1;
        }
      }
      const printers = new Set((body?.printerNames || []).map(lower));
      const busy = new Set((body?.busyPrinters || []).map(lower));
      const perLane = body?.perPrinterLimit > 0 ? Math.min(body.perPrinterLimit, CLAIM_BATCH) : 4;
      const batch = body?.limit > 0 ? Math.min(body.limit, CLAIM_BATCH) : CLAIM_BATCH;
      const rank = new Map();
      const picked = [];
      const pending = [...jobs.values()]
        .filter((job) => job.status === 'PENDING')
        .sort((a, b) => a.seq - b.seq);
      for (const job of pending) {
        if (job.kind === 'GUEST_BILL') {
          if (body?.guestBill) picked.push(job);
        } else if (job.kind === 'ORDER_CANCEL') {
          if (body?.orderCancel) picked.push(job);
        } else if (job.kind === 'KITCHEN_SEND') {
          if (body?.kitchenSend) picked.push(job);
        } else if (printers.has(job.printer) && !busy.has(job.printer)) {
          const n = (rank.get(job.printer) || 0) + 1;
          rank.set(job.printer, n);
          if (n <= perLane) picked.push(job);
        }
        if (picked.length >= batch) break;
      }
      for (const job of picked) {
        job.status = 'CLAIMED';
        job.claimedAt = now;
      }
      const data = picked.map((job) => ({
        id: job.id,
        kind: job.kind,
        payload: JSON.stringify(job.payload),
        createdAt: new Date(job.createdAt).toISOString(),
      }));
      await sleep(RTT_MS / 2);
      if (h.offline) {
        // Response lost on the way back: rows stay CLAIMED until the 45 s stale reclaim.
        throw new Error('Network Error');
      }
      return { data };
    },
    async ack(ids) {
      try {
        await offlineGuard();
      } catch (err) {
        stats.lostAcks += ids.length;
        throw err;
      }
      for (const id of ids) {
        const job = jobs.get(id);
        if (job && (job.status === 'CLAIMED' || job.status === 'PENDING')) job.status = 'DONE';
      }
      return { data: null };
    },
    async release(ids) {
      await offlineGuard();
      for (const id of ids) {
        const job = jobs.get(id);
        if (job?.status === 'CLAIMED') {
          job.status = 'PENDING';
          job.claimedAt = null;
          stats.releases += 1;
        }
      }
      return { data: null };
    },
  };
}

/**
 * Windows printer: spool queue + physical print head. `spooler` mode answers WritePrinter at once
 * (default Windows queue); `direct` mode («печатать прямо на принтер») answers after the paper is
 * out, and the desktop RAW worker gives up after 10 s while the job stays in the Windows queue.
 */
function createDevice(name, { mode = 'spooler', msPerSlip = (lines) => 700 + 120 * lines } = {}) {
  const dev = { name, mode, online: true, queue: [], busy: false, printed: [] };
  dev.pump = () => {
    if (dev.busy || !dev.online || !dev.queue.length) return;
    const item = dev.queue[0];
    dev.busy = true;
    setTimeout(() => {
      dev.busy = false;
      if (dev.online) {
        dev.queue.shift();
        dev.printed.push({ marker: item.marker, at: Date.now(), queuedAt: item.queuedAt });
        item.onPrinted?.();
      }
      dev.pump();
    }, msPerSlip(item.lines));
  };
  dev.setOnline = (online) => {
    dev.online = online;
    dev.pump();
  };
  dev.submit = (marker, lines) => new Promise((resolve, reject) => {
    const item = { marker, lines, queuedAt: Date.now() };
    if (dev.mode === 'direct') {
      const timer = setTimeout(() => reject(new Error('Таймаут RAW-печати')), WORKER_TIMEOUT_MS);
      item.onPrinted = () => {
        clearTimeout(timer);
        resolve({ ok: true, mode: 'escpos' });
      };
      dev.queue.push(item);
      dev.pump();
    } else {
      dev.queue.push(item);
      dev.pump();
      setTimeout(() => resolve({ ok: true, mode: 'escpos' }), 30);
    }
  });
  return dev;
}

function createLaptop({ modes = {} } = {}) {
  const devices = new Map(PRINTERS.map((name) => [lower(name), createDevice(name, { mode: modes[name] })]));
  return {
    devices,
    device: (name) => devices.get(lower(name)),
    bridge: {
      isDesktop: true,
      listPrinters: async () => PRINTERS.map((name) => ({ name })),
      getPrinterSettings: async () => ({ billPrinterName: KASSA, stationPrinters: {} }),
      printPlainEscpos: async (payload) => {
        const dev = devices.get(lower(payload.printerName));
        if (!dev) throw new Error(`Принтер «${payload.printerName}» не найден`);
        const marker = payload.lines.join('\n').match(/job-\d+/)?.[0] || 'unknown';
        return dev.submit(marker, payload.lines.length);
      },
    },
  };
}

/** Pass the same `store` again to simulate an app restart on the same laptop. */
async function startRelay(laptop, store = new Map()) {
  vi.stubGlobal('localStorage', {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
  });
  vi.stubGlobal('window', {
    setTimeout: (...args) => setTimeout(...args),
    clearTimeout: (id) => clearTimeout(id),
    setInterval: (...args) => setInterval(...args),
    clearInterval: (id) => clearInterval(id),
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
    desktopCashier: laptop.bridge,
  });
  vi.resetModules();
  const { useRestaurantPrintRelay } = await import('../../../../src/restaurant/pos/hooks/useRestaurantPrintRelay');
  useRestaurantPrintRelay(1, (_key, opts) => opts?.defaultValue || _key, {});
  return store;
}

const advance = (ms) => vi.advanceTimersByTimeAsync(ms);

async function runUntil(done, maxMs, stepMs = 100) {
  let elapsed = 0;
  while (elapsed < maxMs && !done()) {
    await advance(stepMs);
    elapsed += stepMs;
  }
  return elapsed;
}

/** 10 waiters press «send» within `spreadMs`; each order hits 2–4 stations with 2–6 dishes. */
async function peak(server, rand, { waiters = 10, spreadMs = 2_000, printerOverride } = {}) {
  const created = [];
  for (let w = 0; w < waiters; w += 1) {
    const stations = [...STATIONS].sort(() => rand() - 0.5).slice(0, 2 + Math.floor(rand() * 3));
    const lines = Object.fromEntries(stations.map((s) => [s, 2 + Math.floor(rand() * 5)]));
    created.push(...server.sendOrder(lines, { printerOverride }));
    await advance(spreadMs / waiters);
  }
  return created;
}

function printsOf(laptop, marker) {
  return [...laptop.devices.values()].flatMap((dev) => dev.printed.filter((p) => p.marker === marker));
}

const isPrinted = (laptop) => (job) => printsOf(laptop, job.id).length > 0;
const allPrinted = (laptop, jobs) => () => jobs.every(isPrinted(laptop));

function delayMs(laptop, job) {
  const first = printsOf(laptop, job.id)[0];
  return first ? first.at - job.createdAt : Infinity;
}

function expectEachPrintedOnce(laptop, jobs) {
  const counts = jobs.map((job) => [job.id, printsOf(laptop, job.id).length]);
  expect(counts.filter(([, n]) => n !== 1), 'slips not printed exactly once').toEqual([]);
}

function expectFifoPerStation(laptop) {
  for (const dev of laptop.devices.values()) {
    const seqs = dev.printed
      .filter((p) => /^job-\d+$/.test(p.marker))
      .map((p) => h.server.jobs.get(p.marker))
      .filter((job) => job?.kind === 'CATEGORY_BATCH')
      .map((job) => job.seq);
    expect(seqs, `slip order on ${dev.name}`).toEqual([...seqs].sort((a, b) => a - b));
  }
}

/** Each station finishes within its own physical print time + a small relay overhead. */
function expectStationsInParallel(laptop, jobs, overheadMs = 3_000) {
  const report = {};
  for (const name of PRINTERS) {
    const mine = jobs.filter((job) => job.printer === lower(name) || (job.kind === 'GUEST_BILL' && name === KASSA));
    if (!mine.length) continue;
    const firstCreated = Math.min(...mine.map((job) => job.createdAt));
    const prints = mine.flatMap((job) => printsOf(laptop, job.id));
    const lastAt = Math.max(...prints.map((p) => p.at));
    const workMs = mine.reduce((sum, job) => {
      const lines = job.kind === 'GUEST_BILL' ? 20 : job.payload.lines.length + 6;
      return sum + 700 + 120 * lines;
    }, 0);
    report[name] = { slips: mine.length, lastSec: (lastAt - firstCreated) / 1000, workSec: workMs / 1000 };
    expect(lastAt - firstCreated, `${name} finished`).toBeLessThan(workMs + overheadMs);
  }
  return report;
}

describe('peak hour: 1 laptop, Kassa + 3 LAN printers, 10 waiters', { timeout: 60_000 }, () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: new Date('2026-10-02T13:00:00Z') });
    h.offline = false;
    h.toasts = [];
  });

  afterEach(() => {
    h.cleanups.splice(0).forEach((cleanup) => cleanup());
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('1. peak: 10 orders in 2 s + 3 bills — every slip once, in order, stations in parallel', async () => {
    h.server = createServer();
    const laptop = createLaptop();
    await startRelay(laptop);
    const rand = seeded(7);

    const slips = await peak(h.server, rand);
    const bills = [h.server.requestBill(), h.server.requestBill(), h.server.requestBill()];
    const jobs = [...slips, ...bills];
    await runUntil(allPrinted(laptop, jobs), 120_000);

    expectEachPrintedOnce(laptop, jobs);
    expectFifoPerStation(laptop);
    const report = expectStationsInParallel(laptop, jobs);
    console.info('[peak] per station', report, h.server.stats);
    expect(h.server.stats.staleReclaims).toBe(0);
  });

  it('2. waves: a 10-order peak every minute for 10 minutes — queues do not grow', async () => {
    h.server = createServer();
    const laptop = createLaptop();
    await startRelay(laptop);
    const rand = seeded(11);

    const waves = [];
    for (let minute = 0; minute < 10; minute += 1) {
      const slips = await peak(h.server, rand);
      const bills = [h.server.requestBill(), h.server.requestBill()];
      waves.push([...slips, ...bills]);
      await advance(60_000 - 2_000);
    }
    const all = waves.flat();
    await runUntil(allPrinted(laptop, all), 120_000);

    const maxPerWave = waves.map((jobs) => Math.max(...jobs.map((job) => delayMs(laptop, job))));
    console.info('[waves] max delay per wave, s', maxPerWave.map((ms) => ms / 1000));
    expectEachPrintedOnce(laptop, all);
    expectFifoPerStation(laptop);
    expect(Math.max(...maxPerWave.slice(5))).toBeLessThan(Math.max(...maxPerWave.slice(0, 5)) + 2_000);
  });

  it('3. Kassa in the peak: a cashier receipt waits only behind what is already in the Kassa queue', async () => {
    h.server = createServer();
    const laptop = createLaptop();
    await startRelay(laptop);
    const rand = seeded(3);

    const slips = await peak(h.server, rand);
    const bills = [h.server.requestBill(), h.server.requestBill(), h.server.requestBill()];
    const kassa = laptop.device(KASSA);
    const ahead = kassa.queue.length;
    const workAheadMs = kassa.queue.reduce((sum, item) => sum + 700 + 120 * item.lines, 0) + 700 + 120 * 24;
    kassa.submit('receipt-1', 24);
    await runUntil(allPrinted(laptop, [...slips, ...bills]), 120_000);

    const printed = kassa.printed.find((p) => p.marker === 'receipt-1');
    const waitSec = (printed.at - printed.queuedAt) / 1000;
    console.info('[kassa] receipt waited', waitSec, 's behind', ahead, 'Kassa jobs already queued');
    // Spooled FIFO: the receipt waits only for the paper already ahead of it, never for later slips.
    const after = kassa.printed.filter((p) => p.queuedAt > printed.queuedAt);
    expect(after.every((p) => p.at > printed.at)).toBe(true);
    expect(printed.at - printed.queuedAt).toBeLessThanOrEqual(workAheadMs + 1_000);
  });

  it('4. Shashlik cable out for 2 minutes mid-peak (Windows queue) — others unaffected, Shashlik catches up once', async () => {
    h.server = createServer();
    const laptop = createLaptop();
    await startRelay(laptop);
    const rand = seeded(7);
    const shashlik = laptop.device('Shashlik');

    const slips = await peak(h.server, rand, { spreadMs: 1_000 });
    shashlik.setOnline(false);
    const others = slips.filter((job) => job.printer !== 'shashlik');
    const mine = slips.filter((job) => job.printer === 'shashlik');
    await runUntil(allPrinted(laptop, others), 60_000);
    expectStationsInParallel(laptop, others);

    await advance(60_000);
    // «done ≠ printed»: Windows took the slips, the server already thinks they are printed.
    const ackedButNotPrinted = mine.filter((job) => job.status === 'DONE' && !isPrinted(laptop)(job));
    console.info('[cable out] Shashlik slips acked while the cable was out:', ackedButNotPrinted.length, '/', mine.length);
    expect(ackedButNotPrinted.length).toBe(mine.length);

    shashlik.setOnline(true);
    await runUntil(allPrinted(laptop, mine), 60_000);
    expectEachPrintedOnce(laptop, slips);
    expectFifoPerStation(laptop);
  });

  it('5. Shashlik offline 30 s with «печатать прямо на принтер» — timeouts must not print twice', async () => {
    h.server = createServer();
    const laptop = createLaptop({ modes: { Shashlik: 'direct' } });
    await startRelay(laptop);
    const rand = seeded(7);
    const shashlik = laptop.device('Shashlik');

    const slips = await peak(h.server, rand, { spreadMs: 1_000 });
    shashlik.setOnline(false);
    const others = slips.filter((job) => job.printer !== 'shashlik');
    await runUntil(allPrinted(laptop, others), 60_000);
    expectStationsInParallel(laptop, others);
    await advance(30_000);
    shashlik.setOnline(true);
    await runUntil(allPrinted(laptop, slips), 120_000);
    await advance(60_000);

    const mine = slips.filter((job) => job.printer === 'shashlik');
    const dup = mine.filter((job) => printsOf(laptop, job.id).length > 1).length;
    console.info('[direct offline] Shashlik slips printed twice:', dup, '/', mine.length, h.server.stats);
    expectEachPrintedOnce(laptop, slips);
    expect(h.toasts.some((msg) => msg.includes('shashlik') && msg.includes('не ответил'))).toBe(true);
  });

  it('6e. ack lost, then the app is restarted before the server re-hands the slips — still printed once', async () => {
    h.server = createServer();
    const laptop = createLaptop();
    const store = await startRelay(laptop);
    const rand = seeded(5);

    const realAck = h.server.ack;
    h.server.ack = async (ids) => {
      h.server.stats.lostAcks += ids.length;
      await sleep(RTT_MS);
      throw new Error('Network Error');
    };
    const slips = await peak(h.server, rand);
    await runUntil(allPrinted(laptop, slips), 60_000);
    h.cleanups.splice(0).forEach((cleanup) => cleanup());
    await advance(5_000);
    h.server.ack = realAck;
    await startRelay(laptop, store);
    await advance(120_000);

    const dup = slips.filter((job) => printsOf(laptop, job.id).length > 1).length;
    console.info('[restart] stale reclaims:', h.server.stats.staleReclaims, 'printed twice:', dup);
    expect(h.server.stats.staleReclaims).toBeGreaterThan(0);
    expectEachPrintedOnce(laptop, slips);
    expect(slips.every((job) => job.status === 'DONE')).toBe(true);
  });

  it('6a. laptop loses internet for 60 s in the peak — everything prints once after it is back', async () => {
    h.server = createServer();
    const laptop = createLaptop();
    await startRelay(laptop);
    const rand = seeded(5);

    const first = await peak(h.server, rand, { waiters: 5, spreadMs: 500 });
    h.offline = true;
    // Waiters keep sending from their phones; the server still records the jobs.
    const during = await peak(h.server, rand, { waiters: 5, spreadMs: 2_000 });
    await advance(58_000);
    h.offline = false;
    const all = [...first, ...during];
    await runUntil(allPrinted(laptop, all), 120_000);
    await advance(60_000);

    const dup = all.filter((job) => printsOf(laptop, job.id).length > 1).length;
    console.info('[internet 60s] printed twice:', dup, '/', all.length, h.server.stats);
    expectEachPrintedOnce(laptop, all);
  });

  it('6c. an «printed» ack is lost on a network blip — the slip must not be printed again 45 s later', async () => {
    h.server = createServer();
    const laptop = createLaptop();
    await startRelay(laptop);
    const rand = seeded(5);

    const realAck = h.server.ack;
    let dropped = 0;
    h.server.ack = async (ids) => {
      if (dropped === 0) {
        dropped = ids.length;
        h.server.stats.lostAcks += ids.length;
        await sleep(RTT_MS);
        throw new Error('Network Error');
      }
      return realAck(ids);
    };
    const slips = await peak(h.server, rand);
    await runUntil(allPrinted(laptop, slips), 60_000);
    await advance(90_000);

    const dup = slips.filter((job) => printsOf(laptop, job.id).length > 1).length;
    console.info('[lost ack] acks dropped:', dropped, 'printed twice:', dup, h.server.stats);
    expectEachPrintedOnce(laptop, slips);
  });

  it('6d. acks fail for 60 s (server re-hands the slips after 45 s) — still printed only once', async () => {
    h.server = createServer();
    const laptop = createLaptop();
    await startRelay(laptop);
    const rand = seeded(5);

    const realAck = h.server.ack;
    let acksDownUntil = Infinity;
    h.server.ack = async (ids) => {
      if (Date.now() < acksDownUntil) {
        h.server.stats.lostAcks += ids.length;
        await sleep(RTT_MS);
        throw new Error('Network Error');
      }
      return realAck(ids);
    };
    acksDownUntil = Date.now() + 60_000;
    const slips = await peak(h.server, rand);
    await runUntil(allPrinted(laptop, slips), 60_000);
    await advance(120_000);

    const dup = slips.filter((job) => printsOf(laptop, job.id).length > 1).length;
    console.info('[acks down 60s] stale reclaims:', h.server.stats.staleReclaims, 'printed twice:', dup);
    expect(h.server.stats.staleReclaims).toBeGreaterThan(0);
    expectEachPrintedOnce(laptop, slips);
    expect(slips.every((job) => job.status === 'DONE')).toBe(true);
  });

  it('6b. laptop offline 25 min — slips older than 20 min and bills older than 5 min are dropped, not printed late', async () => {
    h.server = createServer();
    const laptop = createLaptop();
    await startRelay(laptop);
    const rand = seeded(5);

    h.offline = true;
    const stale = [...await peak(h.server, rand), h.server.requestBill()];
    await advance(19 * 60_000);
    const freshSlips = await peak(h.server, rand);
    await runUntil(() => false, 3 * 60_000, 1_000);
    const fresh = [...freshSlips, h.server.requestBill()];
    await runUntil(() => false, 3 * 60_000 - 2_000, 1_000);
    h.offline = false;
    await runUntil(allPrinted(laptop, fresh), 120_000);
    await advance(30_000);

    console.info('[offline 25m] dropped unprinted:', stale.filter((job) => job.expired).length, '/', stale.length);
    expect(stale.every((job) => job.expired && !isPrinted(laptop)(job))).toBe(true);
    expectEachPrintedOnce(laptop, fresh);
  });

  it('7. category points at «Shashlyk» but Windows has «Shashlik» — the cashier is warned, slips expire after 20 min', async () => {
    h.server = createServer();
    h.server.categoryPrinters = { Shashlik: 'Shashlyk' };
    const laptop = createLaptop();
    await startRelay(laptop);
    const rand = seeded(9);

    const slips = await peak(h.server, rand, { printerOverride: { Shashlik: 'Shashlyk' } });
    const typo = slips.filter((job) => job.printer === 'shashlyk');
    const ok = slips.filter((job) => job.printer !== 'shashlyk');
    await runUntil(allPrinted(laptop, ok), 60_000);
    await runUntil(() => false, 21 * 60_000, 1_000);

    console.info('[typo] lost slips:', typo.length, 'toasts shown:', h.toasts.length);
    expect(typo.length).toBeGreaterThan(0);
    expect(typo.every((job) => job.expired && !isPrinted(laptop)(job))).toBe(true);
    expectEachPrintedOnce(laptop, ok);
    expect(h.toasts.filter((msg) => msg.includes('«Shashlyk»'))).toHaveLength(1);
  });
});

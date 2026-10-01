/**
 * Load simulation of the restaurant print relay: the real hook + real executeRestaurantPrintJob +
 * real per-printer lanes, against an in-memory server that mirrors claimPendingFilteredIds
 * (FIFO, per-printer cap, busyPrinters, 45s stale reclaim) and fake Windows printers.
 * Runs on fake timers, so minutes of rush hour take a second.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({ server: null, cleanups: [] }));

vi.mock('react', () => ({
  useRef: (value) => ({ current: value }),
  useEffect: (fn) => {
    const cleanup = fn();
    if (typeof cleanup === 'function') h.cleanups.push(cleanup);
  },
}));
vi.mock('react-hot-toast', () => ({ default: { error: () => {}, success: () => {} } }));
vi.mock('../../../../src/api/client', () => ({
  api: {
    get: () => Promise.reject(new Error('offline')),
    post: () => Promise.reject(new Error('offline')),
  },
}));
vi.mock('../../../../src/restaurant/api/print.api', () => ({
  rstPrintApi: {
    claimPending: (_storeId, body) => h.server.claim(body),
    pollPending: () => Promise.reject(new Error('legacy poll is off in load tests')),
    acknowledge: (_storeId, ids) => h.server.ack(ids),
    release: (_storeId, ids) => h.server.release(ids),
  },
}));

const STALE_MS = 45_000;
const CLAIM_BATCH = 25;
const DEFAULT_PER_PRINTER = 4;
const PRINTERS = Array.from({ length: 10 }, (_, i) => `XP-80 Station ${String(i + 1).padStart(2, '0')}`);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const lower = (s) => String(s || '').trim().toLowerCase();

/** In-memory twin of RestaurantPrintJobRepository claim/ack/release. `fair: false` = old FIFO SQL. */
function createServer({ rttMs = 20, fair = true } = {}) {
  const jobs = new Map();
  let seq = 0;
  const stats = {
    claimCalls: 0,
    staleReclaims: 0,
    releases: 0,
    maxClaimedPerPrinter: 0,
    maxClaimToPrintMs: 0,
  };

  const claimedPerPrinter = () => {
    const counts = new Map();
    for (const job of jobs.values()) {
      // Printed-but-ack-in-transit rows are still CLAIMED on the server; they are not local backlog.
      if (job.status === 'CLAIMED' && job.printedAt == null) counts.set(job.printer, (counts.get(job.printer) || 0) + 1);
    }
    return counts;
  };

  return {
    jobs,
    stats,
    add(printerName) {
      const id = `job-${++seq}`;
      jobs.set(id, {
        id,
        seq,
        printerName,
        printer: lower(printerName),
        status: 'PENDING',
        createdAt: Date.now(),
        claimedAt: null,
        claims: 0,
        printedAt: null,
        prints: 0,
      });
      return id;
    },
    async claim(body) {
      await sleep(rttMs / 2);
      stats.claimCalls += 1;
      const now = Date.now();
      for (const job of jobs.values()) {
        if (job.status === 'CLAIMED' && now - job.claimedAt > STALE_MS) {
          job.status = 'PENDING';
          job.claimedAt = null;
          stats.staleReclaims += 1;
        }
      }
      const printers = new Set((body?.printerNames || []).map(lower));
      const busy = new Set(fair ? (body?.busyPrinters || []).map(lower) : []);
      const perLane = !fair
        ? Infinity
        : body?.perPrinterLimit > 0 ? Math.min(body.perPrinterLimit, CLAIM_BATCH) : DEFAULT_PER_PRINTER;
      const batch = body?.limit > 0 ? Math.min(body.limit, CLAIM_BATCH) : CLAIM_BATCH;

      // LATERAL per printer: oldest perLane each, then oldest `batch` overall.
      const pending = [...jobs.values()]
        .filter((job) => job.status === 'PENDING' && printers.has(job.printer) && !busy.has(job.printer))
        .sort((a, b) => a.seq - b.seq);
      const rank = new Map();
      const picked = [];
      for (const job of pending) {
        const n = (rank.get(job.printer) || 0) + 1;
        rank.set(job.printer, n);
        if (n <= perLane) picked.push(job);
        if (picked.length >= batch) break;
      }
      for (const job of picked) {
        job.status = 'CLAIMED';
        job.claimedAt = now;
        job.claims += 1;
      }
      for (const count of claimedPerPrinter().values()) {
        stats.maxClaimedPerPrinter = Math.max(stats.maxClaimedPerPrinter, count);
      }
      const data = picked.map((job) => ({
        id: job.id,
        kind: 'CATEGORY_SLIP',
        payload: JSON.stringify({
          printerName: job.printerName,
          categoryName: 'Горячее',
          itemName: job.id,
          quantity: 1,
        }),
        createdAt: new Date(job.createdAt).toISOString(),
      }));
      await sleep(rttMs / 2);
      return { data };
    },
    async ack(ids) {
      await sleep(rttMs / 2);
      for (const id of ids) {
        const job = jobs.get(id);
        if (job && (job.status === 'CLAIMED' || job.status === 'PENDING')) job.status = 'DONE';
      }
      return { data: null };
    },
    async release(ids) {
      await sleep(rttMs / 2);
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

/** Fake Aurent desktop: Windows printers with a physical print time; `dead` printers hang the spooler call. */
function createDesktop(server, { latencyMs = () => 400, dead = new Set() } = {}) {
  const active = new Map();
  const printOrder = new Map();
  const stats = { maxConcurrentPerPrinter: 0, slips: 0 };
  return {
    stats,
    printOrder,
    dead,
    bridge: {
      isDesktop: true,
      listPrinters: async () => PRINTERS.map((name) => ({ name })),
      getPrinterSettings: async () => ({ billPrinterName: '', stationPrinters: {} }),
      printPlainEscpos: async (payload) => {
        const key = lower(payload.printerName);
        const id = payload.lines.join('\n').match(/job-\d+/)?.[0];
        if (dead.has(key)) return new Promise(() => {});
        const n = (active.get(key) || 0) + 1;
        active.set(key, n);
        stats.maxConcurrentPerPrinter = Math.max(stats.maxConcurrentPerPrinter, n);
        try {
          await sleep(latencyMs(key));
        } finally {
          active.set(key, active.get(key) - 1);
        }
        stats.slips += 1;
        const job = server.jobs.get(id);
        if (job) {
          job.prints += 1;
          if (job.claimedAt != null) {
            server.stats.maxClaimToPrintMs = Math.max(server.stats.maxClaimToPrintMs, Date.now() - job.claimedAt);
          }
          if (job.printedAt == null) job.printedAt = Date.now();
          if (!printOrder.has(key)) printOrder.set(key, []);
          printOrder.get(key).push(job.seq);
        }
        return { ok: true, mode: 'escpos' };
      },
    },
  };
}

async function startRelay(desktop) {
  const store = new Map();
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
    desktopCashier: desktop.bridge,
  });
  vi.resetModules();
  const { useRestaurantPrintRelay } = await import('../../../../src/restaurant/pos/hooks/useRestaurantPrintRelay');
  useRestaurantPrintRelay(1, (_key, opts) => opts?.defaultValue || _key, {});
}

async function runUntil(done, maxMs, stepMs = 100) {
  let elapsed = 0;
  while (elapsed < maxMs && !done()) {
    await vi.advanceTimersByTimeAsync(stepMs);
    elapsed += stepMs;
  }
  return elapsed;
}

function jobsOf(server, printerName) {
  const key = lower(printerName);
  return [...server.jobs.values()].filter((job) => job.printer === key);
}

const allPrinted = (jobs) => () => jobs.every((job) => job.printedAt != null);
const waitMs = (job) => job.printedAt - job.createdAt;
const percentile = (values, p) => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))];
};

function expectHealthy(server, desktop) {
  const jobs = [...server.jobs.values()];
  console.info('[print-relay]', expect.getState().currentTestName?.split(' > ').pop()?.split(':')[0], {
    slips: jobs.length,
    printed: desktop.stats.slips,
    ...server.stats,
  });
  expect(jobs.filter((job) => job.prints > 1).map((job) => job.id), 'double-printed slips').toEqual([]);
  expect(server.stats.staleReclaims, 'claims older than 45s reclaimed (double-print risk)').toBe(0);
  expect(desktop.stats.maxConcurrentPerPrinter, 'parallel RAW jobs on one printer').toBeLessThanOrEqual(1);
  expect(server.stats.maxClaimedPerPrinter, 'local backlog per printer').toBeLessThanOrEqual(4);
  expect(server.stats.maxClaimToPrintMs, 'claim → print, must stay well under 45s').toBeLessThan(30_000);
}

function expectFifoPerPrinter(desktop) {
  for (const [printer, seqs] of desktop.printOrder) {
    const sorted = [...seqs].sort((a, b) => a - b);
    expect(seqs, `print order on ${printer}`).toEqual(sorted);
  }
}

describe('restaurant print relay under load (10 printers)', () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: new Date('2026-10-02T12:00:00Z') });
  });

  afterEach(() => {
    h.cleanups.splice(0).forEach((cleanup) => cleanup());
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('burst: 600 slips at once (60 per printer) — every printer runs in parallel, once each, in order', async () => {
    h.server = createServer();
    const latency = (key) => 300 + PRINTERS.map(lower).indexOf(key) * 40; // 300..660 ms per slip
    const desktop = createDesktop(h.server, { latencyMs: latency });
    for (let round = 0; round < 60; round += 1) {
      for (const printer of PRINTERS) h.server.add(printer);
    }
    await startRelay(desktop);

    const jobs = [...h.server.jobs.values()];
    const elapsed = await runUntil(allPrinted(jobs), 120_000);

    const slowestIdeal = 60 * latency(lower(PRINTERS[9]));
    expect(jobs.every((job) => job.printedAt != null)).toBe(true);
    expect(elapsed).toBeLessThan(slowestIdeal + 3_000);
    for (const printer of PRINTERS) {
      const ideal = 60 * latency(lower(printer));
      const finished = Math.max(...jobsOf(h.server, printer).map(waitMs));
      expect(finished, `${printer} finished`).toBeLessThan(ideal + 3_000);
    }
    expectHealthy(h.server, desktop);
    expectFifoPerPrinter(desktop);
  });

  it('flood: 300 slips on one printer do not delay the other 9 stations', async () => {
    h.server = createServer();
    const desktop = createDesktop(h.server, { latencyMs: () => 500 });
    for (let i = 0; i < 300; i += 1) h.server.add(PRINTERS[0]);
    for (const printer of PRINTERS.slice(1)) {
      for (let i = 0; i < 10; i += 1) h.server.add(printer);
    }
    await startRelay(desktop);

    const others = PRINTERS.slice(1).flatMap((p) => jobsOf(h.server, p));
    await runUntil(allPrinted(others), 60_000);
    // 10 slips × 0.5 s on their own printer + claim round-trips.
    expect(Math.max(...others.map(waitMs))).toBeLessThan(10 * 500 + 2_000);

    const flooded = jobsOf(h.server, PRINTERS[0]);
    await runUntil(allPrinted(flooded), 240_000);
    // The flooded printer keeps its own full speed (no gaps between slips).
    expect(Math.max(...flooded.map(waitMs))).toBeLessThan(300 * 500 * 1.05 + 2_000);
    expectHealthy(h.server, desktop);
    expectFifoPerPrinter(desktop);
  });

  it('baseline: the old FIFO claim (no per-printer cap) starves the other stations in the same flood', async () => {
    h.server = createServer({ fair: false });
    const desktop = createDesktop(h.server, { latencyMs: () => 500 });
    for (let i = 0; i < 300; i += 1) h.server.add(PRINTERS[0]);
    for (const printer of PRINTERS.slice(1)) {
      for (let i = 0; i < 10; i += 1) h.server.add(printer);
    }
    await startRelay(desktop);

    const others = PRINTERS.slice(1).flatMap((p) => jobsOf(h.server, p));
    await runUntil(allPrinted(others), 240_000);
    expect(Math.max(...others.map(waitMs))).toBeGreaterThan(60_000);
  });

  it('dead printer: a hung spooler on one station does not block the others and never double-prints', async () => {
    h.server = createServer();
    const deadKey = lower(PRINTERS[0]);
    const desktop = createDesktop(h.server, { latencyMs: () => 300, dead: new Set([deadKey]) });
    for (let round = 0; round < 30; round += 1) {
      for (const printer of PRINTERS) h.server.add(printer);
    }
    await startRelay(desktop);

    const others = PRINTERS.slice(1).flatMap((p) => jobsOf(h.server, p));
    await runUntil(allPrinted(others), 60_000);
    expect(Math.max(...others.map(waitMs))).toBeLessThan(30 * 300 + 3_000);

    // Keep the printer dead for two minutes: retries are throttled by the cooldown, no stale reclaim.
    await runUntil(() => false, 120_000);
    const dead = jobsOf(h.server, PRINTERS[0]);
    expect(dead.every((job) => job.printedAt == null)).toBe(true);
    // 12 s print timeout + 8 s cooldown: a handful of retries, not one every 300 ms poll.
    expect(h.server.stats.releases).toBeLessThan(40);

    desktop.dead.delete(deadKey);
    await runUntil(allPrinted(dead), 120_000);
    expect(dead.every((job) => job.printedAt != null)).toBe(true);
    expectHealthy(h.server, desktop);
  });

  it('rush hour: 2 minutes of continuous orders on 10 printers at ~70% load — slips stay near real time', async () => {
    h.server = createServer();
    const desktop = createDesktop(h.server, { latencyMs: () => 400 });
    await startRelay(desktop);

    let seed = 42;
    const rand = () => {
      seed = (seed * 1_103_515_245 + 12_345) % 2 ** 31;
      return seed / 2 ** 31;
    };
    for (let t = 0; t < 120_000; t += 200) {
      const slips = 1 + Math.floor(rand() * 6);
      for (let i = 0; i < slips; i += 1) h.server.add(PRINTERS[Math.floor(rand() * PRINTERS.length)]);
      await vi.advanceTimersByTimeAsync(200);
    }
    const jobs = [...h.server.jobs.values()];
    await runUntil(allPrinted(jobs), 60_000);

    const waits = jobs.map(waitMs);
    const report = {
      slips: jobs.length,
      p50: percentile(waits, 50),
      p95: percentile(waits, 95),
      max: Math.max(...waits),
      claimCalls: h.server.stats.claimCalls,
    };
    console.info('[print-relay rush hour]', report);
    expect(jobs.length).toBeGreaterThan(2_000);
    expect(report.p95).toBeLessThan(3_000);
    expect(report.max).toBeLessThan(8_000);
    expectHealthy(h.server, desktop);
    expectFifoPerPrinter(desktop);
  });
});

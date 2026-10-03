import { useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { rstMenuApi } from '../../api/menu.api';
import { rstPrintApi } from '../../api/print.api';
import {
  getDesktopPrinterSettings,
  isDesktopPrinter,
  listDesktopPrintersCached,
} from '../utils/desktopPrinters';
import { executeRestaurantPrintJob } from '../utils/executeRestaurantPrintJob';
import { prefetchPrintWaiterRoster, seedPrintWaiterRoster } from '../utils/printWaiterNames';
import { createPrintRelayLeader } from '../utils/printRelayLeader';
import { onRestaurantPrintFlush } from '../utils/restaurantPrintFlush';

const POLL_MS = 300;
const CAPS_TIMEOUT_MS = 2500;
/**
 * Per category printer: claim more only when fewer than BUSY_AT slips wait in its lane, at most
 * PER_PRINTER_CLAIM per claim. Worst lane = BUSY_AT - 1 + PER_PRINTER_CLAIM = 4 slips × 10s
 * timeout, under the server stale-claim window (45s) — otherwise a reclaim could print twice.
 */
const BUSY_AT = 2;
const PER_PRINTER_CLAIM = 3;
const MAX_LANE = BUSY_AT - 1 + PER_PRINTER_CLAIM;
/**
 * Claimed-but-unprinted cap across all printers. Scales with the printer count: a fixed 24 left
 * 20 stations with ~1 slip each, so every printer idled for a claim round-trip between slips.
 */
const MIN_IN_FLIGHT = 24;
/** Server caps one claim at 25 rows (PrintJobServiceImpl.CLAIM_BATCH). */
const SERVER_CLAIM_BATCH = 25;

function maxInFlight(caps) {
  return Math.max(MIN_IN_FLIGHT, (caps?.printerNames?.length || 0) * MAX_LANE + 4);
}
/** After a print error the printer is skipped in claims for a while (no instant retry storm). */
const PRINTER_COOLDOWN_MS = 8_000;
const SETTLE_FLUSH_MS = 40;
const SETTLE_RETRY_MS = 1_000;
/** Matches the server slip TTL: after that the job is closed server-side anyway. */
const PRINTED_MEMORY_MS = 20 * 60_000;
const UNCERTAIN_WARN_MS = 30_000;
const CATEGORY_CHECK_MS = 60_000;

function printedStorageKey(storeId) {
  return `rst-print-relay-printed:${storeId}`;
}

/** Survives an app restart: a lost ack must not reprint the slip after relaunch either. */
function loadPrinted(storeId) {
  const map = new Map();
  try {
    const rows = JSON.parse(localStorage.getItem(printedStorageKey(storeId)) || '[]');
    const cutoff = Date.now() - PRINTED_MEMORY_MS;
    for (const [jobId, at] of Array.isArray(rows) ? rows : []) {
      if (jobId != null && at >= cutoff) map.set(jobId, at);
    }
  } catch {
    /* corrupt / no storage — start empty */
  }
  return map;
}

function savePrinted(storeId, map) {
  try {
    localStorage.setItem(printedStorageKey(storeId), JSON.stringify([...map]));
  } catch {
    /* quota / no storage */
  }
}

function categoryPrinterKey(job) {
  if (job?.kind !== 'CATEGORY_SLIP' && job?.kind !== 'CATEGORY_BATCH') return null;
  try {
    const payload = typeof job.payload === 'string' ? JSON.parse(job.payload) : job.payload;
    const name = String(payload?.printerName || '').trim().toLowerCase();
    return name || null;
  } catch {
    return null;
  }
}

function withTimeout(promise, ms, fallback) {
  let timer;
  return Promise.race([
    Promise.resolve(promise).finally(() => {
      if (timer != null) window.clearTimeout(timer);
    }),
    new Promise((resolve) => {
      timer = window.setTimeout(() => resolve(fallback), ms);
    }),
  ]);
}

async function loadClaimCapabilities() {
  const [list, settings] = await Promise.all([
    withTimeout(listDesktopPrintersCached().catch(() => []), CAPS_TIMEOUT_MS, []),
    withTimeout(getDesktopPrinterSettings().catch(() => null), CAPS_TIMEOUT_MS, null),
  ]);
  const fromOs = (Array.isArray(list) ? list : [])
    .map((p) => String(p?.name || p).trim())
    .filter(Boolean);
  const fromSettings = [
    settings?.billPrinterName,
    ...Object.values(settings?.stationPrinters || {}),
  ]
    .map((name) => String(name || '').trim())
    .filter(Boolean);
  const guestBill = Boolean(String(settings?.billPrinterName || '').trim());
  // Local-first prints kitchen/category on this PC via SQLite PrintWorker — do not claim those jobs again.
  const localFirst = Boolean(
    typeof window !== 'undefined' && (
      typeof window.desktopCashier?.restaurantLocalFirstFlag === 'function'
        ? window.desktopCashier.restaurantLocalFirstFlag() === true
        : window.desktopCashier?.restaurantLocalFirst === true
    ),
  );
  const kitchenSend = localFirst
    ? false
    : Object.values(settings?.stationPrinters || {}).some((name) => String(name || '').trim());
  const printerNames = localFirst
    ? [...new Set([
      ...(String(settings?.billPrinterName || '').trim()
        ? [String(settings.billPrinterName).trim()]
        : []),
    ])]
    : [...new Set([...fromOs, ...fromSettings])];
  return { printerNames, guestBill, kitchenSend };
}

function capsReady(caps) {
  return Boolean(caps?.guestBill || caps?.kitchenSend || caps?.printerNames?.length);
}

async function fetchJobs(storeId, caps, limit) {
  try {
    const res = await rstPrintApi.claimPending(storeId, { ...caps, limit });
    return res.data ?? [];
  } catch {
    // Claim filter failed (old build / SQL) — fall back to legacy poll so printing never dies.
    const res = await rstPrintApi.pollPending(storeId);
    return res.data ?? [];
  }
}

/**
 * Polls server print jobs and runs them on this desktop (bill / kitchen / category slips).
 * One capable leader window per machine; claim is filtered, with legacy poll fallback.
 */
export function useRestaurantPrintRelay(storeId, t, waiterNameById) {
  const busyRef = useRef(false);
  const pendingFlushRef = useRef(false);
  const tRef = useRef(t);
  tRef.current = t;
  const waiterMapRef = useRef(waiterNameById);
  waiterMapRef.current = waiterNameById;
  const storeIdRef = useRef(storeId);
  storeIdRef.current = storeId;
  const warnedMissingRef = useRef(new Set());
  const capsRef = useRef({ printerNames: [], guestBill: false, kitchenSend: false });

  useEffect(() => {
    if (storeId == null) return;
    seedPrintWaiterRoster(storeId, waiterNameById);
  }, [storeId, waiterNameById]);

  useEffect(() => {
    if (storeId == null || !isDesktopPrinter()) return undefined;

    let cancelled = false;
    const leader = createPrintRelayLeader();

    const refreshCaps = async () => {
      try {
        const caps = await loadClaimCapabilities();
        if (!cancelled) capsRef.current = caps;
        return caps;
      } catch {
        return capsRef.current;
      }
    };

    const inFlight = new Set();
    const perPrinter = new Map();
    const cooldownUntil = new Map();
    const ackQueue = [];
    const releaseQueue = [];
    /** Printed here: if the ack is lost the server re-hands the job after 45 s — ack it, never reprint. */
    const printedAt = loadPrinted(storeId);
    const uncertainWarnedAt = new Map();
    let settleTimer = null;

    const forgetOldPrinted = () => {
      const cutoff = Date.now() - PRINTED_MEMORY_MS;
      for (const [jobId, at] of printedAt) {
        if (at < cutoff) printedAt.delete(jobId);
      }
    };

    const warnUncertain = (job, printerKey) => {
      const label = printerKey
        || (job.kind === 'GUEST_BILL' ? 'счёт' : 'кухня');
      const now = Date.now();
      if (now - (uncertainWarnedAt.get(label) || 0) < UNCERTAIN_WARN_MS) return;
      uncertainWarnedAt.set(label, now);
      toast.error(
        tRef.current('rst.admin.printUncertain', {
          printer: label,
          defaultValue: `Принтер «${label}» не ответил — проверьте, вышел ли чек. Повторно не печатаем.`,
        }),
        { duration: 10_000 },
      );
    };

    // Autoprint category on a printer this PC does not have: its slips would wait unseen until expiry.
    const checkCategoryPrinters = async () => {
      try {
        const [res, list] = await Promise.all([
          rstMenuApi.listCategories(storeId, true),
          listDesktopPrintersCached(),
        ]);
        if (cancelled) return;
        const local = new Set((Array.isArray(list) ? list : [])
          .map((p) => String(p?.name || p).trim().toLowerCase())
          .filter(Boolean));
        if (!local.size) return;
        const categories = res?.data || [];
        // Satellite POS (no station printers on this Windows) — cashier/hub prints via relay.
        const ownsAny = categories.some((category) => {
          const printer = String(category?.printPrinterName || '').trim();
          return Boolean(category?.autoPrint && printer && local.has(printer.toLowerCase()));
        });
        if (!ownsAny) return;
        for (const category of categories) {
          const printer = String(category?.printPrinterName || '').trim();
          if (!category?.autoPrint || !printer || local.has(printer.toLowerCase())) continue;
          const key = `${storeId}:category-printer-missing:${printer.toLowerCase()}`;
          if (warnedMissingRef.current.has(key)) continue;
          warnedMissingRef.current.add(key);
          toast.error(
            tRef.current('rst.admin.categoryPrinterMissing', {
              printer,
              category: category.name || '',
              defaultValue: `Принтер «${printer}» (категория «${category.name || ''}») не найден на этом ПК — слипы не печатаются`,
            }),
            { duration: 15_000 },
          );
        }
      } catch {
        /* offline / old API — next check */
      }
    };

    // A dropped ack/release is put back and retried; losing an ack means printing the slip twice.
    const flushSettled = async () => {
      settleTimer = null;
      const ackIds = ackQueue.splice(0);
      const releaseIds = releaseQueue.splice(0);
      let failed = false;
      if (ackIds.length) {
        await rstPrintApi.acknowledge(storeId, ackIds).catch(() => {
          ackQueue.unshift(...ackIds);
          failed = true;
        });
      }
      if (releaseIds.length) {
        await rstPrintApi.release(storeId, releaseIds).catch(() => {
          releaseQueue.unshift(...releaseIds);
          failed = true;
        });
      }
      if (failed && !cancelled && settleTimer == null) {
        settleTimer = window.setTimeout(flushSettled, SETTLE_RETRY_MS);
      }
    };

    const scheduleSettle = () => {
      if (settleTimer == null) settleTimer = window.setTimeout(flushSettled, SETTLE_FLUSH_MS);
    };

    const warnMissingStations = (job, outcome) => {
      if (
        outcome?.ack
        || (outcome?.mode !== 'missing' && outcome?.mode !== 'partial')
        || !outcome?.configured
        || job.kind !== 'KITCHEN_SEND'
        || !outcome?.missing?.length
      ) return;
      const stations = outcome.missing.filter(Boolean).join(', ');
      const key = `${storeId}:kitchen-missing:${stations}`;
      if (warnedMissingRef.current.has(key)) return;
      warnedMissingRef.current.add(key);
      toast.error(
        tRef.current('rst.admin.kitchenPrinterMissing', {
          stations,
          defaultValue: `Нет принтера для станции: ${stations}`,
        }),
      );
    };

    const busyPrinters = () => {
      const now = Date.now();
      const busy = [];
      for (const [key, count] of perPrinter) {
        if (count >= BUSY_AT) busy.push(key);
      }
      for (const [key, until] of cooldownUntil) {
        if (until <= now) cooldownUntil.delete(key);
        else if (!busy.includes(key)) busy.push(key);
      }
      return busy;
    };

    let tick;

    // Each job settles on its own: a slow printer no longer holds back the rest of the batch.
    const runJob = async (job) => {
      const printerKey = categoryPrinterKey(job);
      if (printerKey) perPrinter.set(printerKey, (perPrinter.get(printerKey) || 0) + 1);
      let outcome;
      try {
        outcome = await executeRestaurantPrintJob(job, {
          t: tRef.current,
          waiterNameById: waiterMapRef.current,
          storeId: storeIdRef.current,
        });
      } catch {
        outcome = { ack: false, release: true, mode: 'error' };
      }
      inFlight.delete(job.id);
      if (printerKey) {
        const left = (perPrinter.get(printerKey) || 1) - 1;
        if (left > 0) perPrinter.set(printerKey, left);
        else perPrinter.delete(printerKey);
        if (outcome?.mode === 'error' || outcome?.mode === 'uncertain') {
          cooldownUntil.set(printerKey, Date.now() + PRINTER_COOLDOWN_MS);
        }
      }
      if (outcome?.mode === 'uncertain') warnUncertain(job, printerKey);
      if (outcome?.ack) {
        printedAt.set(job.id, Date.now());
        savePrinted(storeId, printedAt);
        ackQueue.push(job.id);
      } else if (outcome?.release !== false) {
        releaseQueue.push(job.id);
      }
      warnMissingStations(job, outcome);
      scheduleSettle();
      if (!cancelled) tick();
    };

    tick = async () => {
      if (cancelled) return;
      if (!capsReady(capsRef.current)) {
        await refreshCaps();
      }
      // Only a window that can actually print should hold the leader lock.
      if (!capsReady(capsRef.current)) return;
      if (!leader.isLeader()) return;
      if (busyRef.current) {
        pendingFlushRef.current = true;
        return;
      }
      busyRef.current = true;
      try {
        do {
          pendingFlushRef.current = false;
          const caps = capsRef.current;
          if (!capsReady(caps)) break;
          const room = maxInFlight(caps) - inFlight.size;
          if (room <= 0) break;
          if (!leader.isLeader()) break;
          const limit = Math.min(room, SERVER_CLAIM_BATCH);
          const jobs = await fetchJobs(storeId, {
            ...caps,
            busyPrinters: busyPrinters(),
            perPrinterLimit: PER_PRINTER_CLAIM,
          }, limit);
          if (cancelled) break;
          // A full batch means more is waiting — claim again now instead of on the next 300 ms poll.
          if (jobs.length >= limit) pendingFlushRef.current = true;
          forgetOldPrinted();
          for (const job of jobs) {
            // Stale-reclaimed job we are still printing — keep the original run.
            if (!job?.id || inFlight.has(job.id)) continue;
            if (printedAt.has(job.id)) {
              ackQueue.push(job.id);
              scheduleSettle();
              continue;
            }
            inFlight.add(job.id);
            runJob(job);
          }
        } while (pendingFlushRef.current && !cancelled);
      } catch {
        /* network blip — next poll */
      } finally {
        busyRef.current = false;
      }
    };

    (async () => {
      await refreshCaps();
      if (cancelled) return;
      if (capsReady(capsRef.current)) leader.start();
      prefetchPrintWaiterRoster(storeId, waiterMapRef.current).catch(() => {});
      tick();
      if (capsReady(capsRef.current)) checkCategoryPrinters();
    })();

    const id = window.setInterval(tick, POLL_MS);
    const capsTimer = window.setInterval(() => {
      refreshCaps().then((caps) => {
        if (!cancelled && capsReady(caps)) leader.start();
      });
    }, 15_000);
    const categoryTimer = window.setInterval(() => {
      if (leader.isLeader()) checkCategoryPrinters();
    }, CATEGORY_CHECK_MS);
    const offFlush = onRestaurantPrintFlush(() => {
      if (cancelled) return;
      pendingFlushRef.current = true;
      refreshCaps().then(() => tick());
    });
    return () => {
      cancelled = true;
      window.clearInterval(id);
      window.clearInterval(capsTimer);
      window.clearInterval(categoryTimer);
      offFlush();
      leader.stop();
      if (settleTimer != null) window.clearTimeout(settleTimer);
      flushSettled();
    };
  }, [storeId]);
}

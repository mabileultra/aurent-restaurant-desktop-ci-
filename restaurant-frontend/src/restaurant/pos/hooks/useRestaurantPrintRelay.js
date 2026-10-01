import { useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
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
/** Claimed-but-unprinted cap across all printers. */
const MAX_IN_FLIGHT = 24;
/**
 * Per category printer: claim more only when fewer than BUSY_AT slips wait in its lane, at most
 * PER_PRINTER_CLAIM per claim. Worst lane = BUSY_AT - 1 + PER_PRINTER_CLAIM = 4 slips × 10s
 * timeout, under the server stale-claim window (45s) — otherwise a reclaim could print twice.
 */
const BUSY_AT = 2;
const PER_PRINTER_CLAIM = 3;
/** After a print error the printer is skipped in claims for a while (no instant retry storm). */
const PRINTER_COOLDOWN_MS = 8_000;
const SETTLE_FLUSH_MS = 40;

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
  const printerNames = [...new Set([...fromOs, ...fromSettings])];
  const guestBill = Boolean(String(settings?.billPrinterName || '').trim());
  const kitchenSend = Object.values(settings?.stationPrinters || {})
    .some((name) => String(name || '').trim());
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
    let settleTimer = null;

    const flushSettled = async () => {
      settleTimer = null;
      const ackIds = ackQueue.splice(0);
      const releaseIds = releaseQueue.splice(0);
      if (ackIds.length) {
        await rstPrintApi.acknowledge(storeId, ackIds).catch(() => {});
      }
      if (releaseIds.length) {
        await rstPrintApi.release(storeId, releaseIds).catch(() => {});
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
        if (outcome?.mode === 'error') {
          cooldownUntil.set(printerKey, Date.now() + PRINTER_COOLDOWN_MS);
        }
      }
      if (outcome?.ack) {
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
          const room = MAX_IN_FLIGHT - inFlight.size;
          if (room <= 0) break;
          if (!leader.isLeader()) break;
          const caps = capsRef.current;
          if (!capsReady(caps)) break;
          const jobs = await fetchJobs(storeId, {
            ...caps,
            busyPrinters: busyPrinters(),
            perPrinterLimit: PER_PRINTER_CLAIM,
          }, room);
          if (cancelled) break;
          for (const job of jobs) {
            // Stale-reclaimed job we are still printing — keep the original run.
            if (!job?.id || inFlight.has(job.id)) continue;
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
    })();

    const id = window.setInterval(tick, POLL_MS);
    const capsTimer = window.setInterval(() => {
      refreshCaps().then((caps) => {
        if (!cancelled && capsReady(caps)) leader.start();
      });
    }, 15_000);
    const offFlush = onRestaurantPrintFlush(() => {
      if (cancelled) return;
      pendingFlushRef.current = true;
      refreshCaps().then(() => tick());
    });
    return () => {
      cancelled = true;
      window.clearInterval(id);
      window.clearInterval(capsTimer);
      offFlush();
      leader.stop();
      if (settleTimer != null) window.clearTimeout(settleTimer);
      flushSettled();
    };
  }, [storeId]);
}

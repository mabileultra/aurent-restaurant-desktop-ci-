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

async function fetchJobs(storeId, caps) {
  try {
    const res = await rstPrintApi.claimPending(storeId, caps);
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

    const tick = async () => {
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
          if (!leader.isLeader()) break;
          const caps = capsRef.current;
          if (!capsReady(caps)) break;
          const jobs = await fetchJobs(storeId, caps);
          if (cancelled) break;
          if (!jobs.length) continue;

          const results = await Promise.allSettled(
            jobs.map(async (job) => {
              const outcome = await executeRestaurantPrintJob(job, {
                t: tRef.current,
                waiterNameById: waiterMapRef.current,
                storeId: storeIdRef.current,
              });
              return { job, outcome };
            }),
          );

          const ackIds = [];
          const releaseIds = [];
          for (const result of results) {
            if (result.status !== 'fulfilled') continue;
            const { job, outcome } = result.value;
            if (!job?.id) continue;
            if (outcome?.ack) {
              ackIds.push(job.id);
            } else if (outcome?.release !== false) {
              releaseIds.push(job.id);
            }
            if (
              !outcome?.ack
              && (outcome?.mode === 'missing' || outcome?.mode === 'partial')
              && outcome?.configured
              && job.kind === 'KITCHEN_SEND'
              && outcome?.missing?.length
            ) {
              const stations = outcome.missing.filter(Boolean).join(', ');
              const key = `${storeId}:kitchen-missing:${stations}`;
              if (!warnedMissingRef.current.has(key)) {
                warnedMissingRef.current.add(key);
                toast.error(
                  tRef.current('rst.admin.kitchenPrinterMissing', {
                    stations,
                    defaultValue: `Нет принтера для станции: ${stations}`,
                  }),
                );
              }
            }
          }
          if (!cancelled && ackIds.length) {
            await rstPrintApi.acknowledge(storeId, ackIds).catch(() => {});
          }
          if (!cancelled && releaseIds.length) {
            await rstPrintApi.release(storeId, releaseIds).catch(() => {});
          }
        } while (pendingFlushRef.current && !cancelled);
      } catch {
        /* network blip — next poll */
      } finally {
        busyRef.current = false;
        if (pendingFlushRef.current && !cancelled) {
          pendingFlushRef.current = false;
          window.setTimeout(() => {
            if (!cancelled) tick();
          }, 0);
        }
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
    };
  }, [storeId]);
}

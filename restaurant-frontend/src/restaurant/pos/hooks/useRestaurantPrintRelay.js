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

async function loadClaimCapabilities() {
  const [list, settings] = await Promise.all([
    listDesktopPrintersCached().catch(() => []),
    getDesktopPrinterSettings().catch(() => null),
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

/**
 * Polls server print jobs and runs them on this desktop (bill / kitchen / category slips).
 * One leader window per machine; server only hands out jobs for this PC's printers.
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
    leader.start();

    const refreshCaps = () => {
      loadClaimCapabilities()
        .then((caps) => {
          if (!cancelled) capsRef.current = caps;
        })
        .catch(() => {});
    };
    refreshCaps();
    const capsTimer = window.setInterval(refreshCaps, 30_000);

    prefetchPrintWaiterRoster(storeId, waiterMapRef.current).catch(() => {});

    const tick = async () => {
      if (cancelled) return;
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
          if (!caps.guestBill && !caps.kitchenSend && !caps.printerNames.length) {
            continue;
          }
          const res = await rstPrintApi.claimPending(storeId, caps);
          if (cancelled) break;
          const jobs = res.data ?? [];
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

    tick();
    const id = window.setInterval(tick, POLL_MS);
    const offFlush = onRestaurantPrintFlush(() => {
      if (cancelled) return;
      pendingFlushRef.current = true;
      refreshCaps();
      tick();
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

import { useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { rstPrintApi } from '../../api/print.api';
import { isDesktopPrinter, listDesktopPrintersCached } from '../utils/desktopPrinters';
import { executeRestaurantPrintJob } from '../utils/executeRestaurantPrintJob';
import { onRestaurantPrintFlush } from '../utils/restaurantPrintFlush';

const POLL_MS = 500;

/**
 * Polls server print jobs and runs them on this desktop (bill / kitchen / category slips).
 * Jobs for different printers run in parallel so one slow device does not block others.
 */
export function useRestaurantPrintRelay(storeId, t) {
  const busyRef = useRef(false);
  const pendingFlushRef = useRef(false);
  const tRef = useRef(t);
  tRef.current = t;
  const warnedMissingRef = useRef(new Set());

  useEffect(() => {
    if (storeId == null || !isDesktopPrinter()) return undefined;

    let cancelled = false;
    listDesktopPrintersCached().catch(() => {});

    const tick = async () => {
      if (cancelled) return;
      if (busyRef.current) {
        pendingFlushRef.current = true;
        return;
      }
      busyRef.current = true;
      try {
        do {
          pendingFlushRef.current = false;
          const res = await rstPrintApi.pollPending(storeId);
          if (cancelled) break;
          const jobs = res.data ?? [];
          if (!jobs.length) continue;

          const results = await Promise.allSettled(
            jobs.map(async (job) => {
              const outcome = await executeRestaurantPrintJob(job, { t: tRef.current });
              return { job, outcome };
            }),
          );

          const ackIds = [];
          for (const result of results) {
            if (result.status !== 'fulfilled') continue;
            const { job, outcome } = result.value;
            if (outcome?.ack && job.id) ackIds.push(job.id);
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
          if (ackIds.length && !cancelled) {
            await rstPrintApi.acknowledge(storeId, ackIds);
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
      tick();
    });
    return () => {
      cancelled = true;
      window.clearInterval(id);
      offFlush();
    };
  }, [storeId]);
}

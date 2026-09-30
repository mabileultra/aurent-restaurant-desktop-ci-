import { useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { rstPrintApi } from '../../api/print.api';
import { isDesktopPrinter, listDesktopPrintersCached } from '../utils/desktopPrinters';
import { executeRestaurantPrintJob } from '../utils/executeRestaurantPrintJob';
import { onRestaurantPrintFlush } from '../utils/restaurantPrintFlush';

const POLL_MS = 350;

/**
 * Polls server print jobs and runs them on this desktop (bill / kitchen / category slips).
 */
export function useRestaurantPrintRelay(storeId, t) {
  const busyRef = useRef(false);
  const tRef = useRef(t);
  tRef.current = t;
  const warnedMissingRef = useRef(new Set());
  const tickRef = useRef(null);

  useEffect(() => {
    if (storeId == null || !isDesktopPrinter()) return undefined;

    let cancelled = false;
    listDesktopPrintersCached().catch(() => {});

    const tick = async () => {
      if (cancelled || busyRef.current) return;
      busyRef.current = true;
      try {
        const res = await rstPrintApi.pollPending(storeId);
        const jobs = res.data ?? [];
        const ackIds = [];
        for (const job of jobs) {
          if (cancelled) break;
          try {
            const outcome = await executeRestaurantPrintJob(job, { t: tRef.current });
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
          } catch {
            /* leave pending for retry */
          }
        }
        if (ackIds.length && !cancelled) {
          await rstPrintApi.acknowledge(storeId, ackIds);
        }
      } catch {
        /* network blip — next poll */
      } finally {
        busyRef.current = false;
      }
    };

    tickRef.current = tick;
    tick();
    const id = window.setInterval(tick, POLL_MS);
    const offFlush = onRestaurantPrintFlush(() => {
      window.setTimeout(() => {
        if (!cancelled) tick();
      }, 40);
    });
    return () => {
      cancelled = true;
      tickRef.current = null;
      window.clearInterval(id);
      offFlush();
    };
  }, [storeId]);
}

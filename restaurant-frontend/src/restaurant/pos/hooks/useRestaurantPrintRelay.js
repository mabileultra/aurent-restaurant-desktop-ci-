import { useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { rstPrintApi } from '../../api/print.api';
import { isDesktopPrinter } from '../utils/desktopPrinters';
import { executeRestaurantPrintJob } from '../utils/executeRestaurantPrintJob';

const POLL_MS = 800;

/**
 * Polls server print jobs and runs them on this desktop (bill / kitchen / category slips).
 */
export function useRestaurantPrintRelay(storeId, t) {
  const busyRef = useRef(false);
  const tRef = useRef(t);
  tRef.current = t;
  const warnedMissingRef = useRef(new Set());

  useEffect(() => {
    if (storeId == null || !isDesktopPrinter()) return undefined;

    let cancelled = false;

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

    tick();
    const id = window.setInterval(tick, POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [storeId]);
}

import { useEffect, useRef } from 'react';
import { rstPrintApi } from '../../api/print.api';
import { isDesktopPrinter } from '../utils/desktopPrinters';
import { executeRestaurantPrintJob } from '../utils/executeRestaurantPrintJob';

const POLL_MS = 2500;

/**
 * Polls server print jobs and runs them on this desktop (bill / kitchen / category slips).
 */
export function useRestaurantPrintRelay(storeId, t) {
  const busyRef = useRef(false);
  const tRef = useRef(t);
  tRef.current = t;

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

/**
 * Очередь сканов кассы: пока идёт lookup, следующие коды не теряются.
 * При переполнении сдвигаем самый старый (редкий случай при max ≥ 24).
 */
export function createPosScanQueue({ maxPending = 24 } = {}) {
  const pending = [];
  let busy = false;

  async function pump(process) {
    if (busy) return;
    busy = true;
    try {
      while (pending.length > 0) {
        const job = pending.shift();
        try {
          await process(job.code, job.opts);
        } catch {
          /* process handles toasts */
        }
      }
    } finally {
      busy = false;
      if (pending.length > 0) {
        void pump(process);
      }
    }
  }

  return {
    enqueue(code, opts, process) {
      const trimmed = String(code || '').trim();
      if (!trimmed) return Promise.resolve();
      if (pending.length >= maxPending) {
        pending.shift();
      }
      pending.push({ code: trimmed, opts: opts || {} });
      return pump(process);
    },
    get size() {
      return pending.length;
    },
    get busy() {
      return busy;
    },
  };
}

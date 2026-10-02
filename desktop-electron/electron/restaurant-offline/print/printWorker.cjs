/**
 * C4 — PrintWorker: claim PENDING → PRINTING → PRINTED | FAILED.
 * Inject `printTicket` for tests. Never auto-retries UNKNOWN/FAILED.
 * Never writes orders / outbox.
 */

const {
  PRINT_JOB_STATUS,
  allowsAutoPrintRetry,
} = require('../domain/printJobStatus.cjs');
const { createPrintJobRepo } = require('../db/printJobRepo.cjs');
const { payloadToTicketLines } = require('./payloadToLines.cjs');
const { recoverStalePrintingJobs, DEFAULT_STALE_MS } = require('./recoverStalePrinting.cjs');

/**
 * Errors before spooler accepted data → FAILED (safe to later manual reprint).
 * Timeout / uncertain mid-flight → UNKNOWN (no auto-retry).
 */
function classifyPrintError(err) {
  const msg = String(err?.message || err || '');
  if (/timeout|таймаут|uncertain|не ответил|callbackTimeout/i.test(msg)) {
    return { status: PRINT_JOB_STATUS.UNKNOWN, error: msg };
  }
  return { status: PRINT_JOB_STATUS.FAILED, error: msg };
}

function createPrintWorker(db, {
  printTicket,
  clock = () => new Date().toISOString(),
  nowMs = () => Date.now(),
  staleAfterMs = DEFAULT_STALE_MS,
} = {}) {
  if (typeof printTicket !== 'function') {
    throw new Error('print_ticket_fn_required');
  }

  const prints = createPrintJobRepo(db, { clock });
  let running = false;

  async function processJob(row) {
    if (!allowsAutoPrintRetry(row.status)) {
      return { id: row.id, skipped: true, status: row.status };
    }
    prints.transition(row.id, PRINT_JOB_STATUS.PRINTING);
    let ticket;
    try {
      ticket = payloadToTicketLines(row.payload_json);
    } catch (err) {
      prints.transition(row.id, PRINT_JOB_STATUS.FAILED, { error: err.message || err });
      return { id: row.id, status: PRINT_JOB_STATUS.FAILED, error: String(err.message || err) };
    }
    if (!ticket.printerName) {
      prints.transition(row.id, PRINT_JOB_STATUS.FAILED, { error: 'printer_name_empty' });
      return { id: row.id, status: PRINT_JOB_STATUS.FAILED, error: 'printer_name_empty' };
    }
    try {
      await printTicket({
        printerName: ticket.printerName,
        title: ticket.title,
        lines: ticket.lines,
        jobId: row.id,
        payload: typeof row.payload_json === 'string'
          ? JSON.parse(row.payload_json)
          : row.payload_json,
      });
      prints.transition(row.id, PRINT_JOB_STATUS.PRINTED);
      return { id: row.id, status: PRINT_JOB_STATUS.PRINTED };
    } catch (err) {
      const classified = classifyPrintError(err);
      prints.transition(row.id, classified.status, { error: classified.error });
      return { id: row.id, status: classified.status, error: classified.error };
    }
  }

  async function tick({ limit = 10 } = {}) {
    if (running) return { busy: true, results: [] };
    running = true;
    try {
      recoverStalePrintingJobs(db, {
        nowMs: nowMs(),
        staleAfterMs,
        clock,
      });
      const pending = prints.listPending(limit);
      const results = [];
      for (const row of pending) {
        // Re-read: another worker/lane shouldn't double-print; only PENDING auto-runs.
        const fresh = prints.getById(row.id);
        if (!fresh || !allowsAutoPrintRetry(fresh.status)) continue;
        results.push(await processJob(fresh));
      }
      return { busy: false, results };
    } finally {
      running = false;
    }
  }

  return {
    tick,
    processJob,
    recover: () => recoverStalePrintingJobs(db, { nowMs: nowMs(), staleAfterMs, clock }),
  };
}

module.exports = {
  createPrintWorker,
  classifyPrintError,
  payloadToTicketLines: require('./payloadToLines.cjs').payloadToTicketLines,
};

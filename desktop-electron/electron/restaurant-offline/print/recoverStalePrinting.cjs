/**
 * C5 — on process start: stale PRINTING → UNKNOWN (never auto PENDING).
 * PrintWorker never mutates orders.
 */

const {
  PRINT_JOB_STATUS,
  resolveStalePrinting,
} = require('../domain/printJobStatus.cjs');
const { createPrintJobRepo } = require('../db/printJobRepo.cjs');

const DEFAULT_STALE_MS = 30_000;

function listPrintingJobs(db) {
  return db.prepare(
    `SELECT * FROM print_jobs WHERE status = ? ORDER BY started_at ASC`,
  ).all(PRINT_JOB_STATUS.PRINTING);
}

/**
 * @param {object} db
 * @param {{ nowMs?: number, staleAfterMs?: number, clock?: () => string }} [opts]
 * @returns {{ promoted: string[] }}
 */
function recoverStalePrintingJobs(db, opts = {}) {
  const nowMs = opts.nowMs ?? Date.now();
  const staleAfterMs = opts.staleAfterMs ?? DEFAULT_STALE_MS;
  const prints = createPrintJobRepo(db, { clock: opts.clock });
  const promoted = [];

  for (const row of listPrintingJobs(db)) {
    const startedAtMs = row.started_at ? Date.parse(row.started_at) : null;
    const next = resolveStalePrinting(row.status, startedAtMs, nowMs, staleAfterMs);
    if (next !== PRINT_JOB_STATUS.UNKNOWN) continue;
    prints.transition(row.id, PRINT_JOB_STATUS.UNKNOWN, {
      error: 'stale_printing_after_restart',
    });
    promoted.push(row.id);
  }
  return { promoted };
}

module.exports = {
  DEFAULT_STALE_MS,
  listPrintingJobs,
  recoverStalePrintingJobs,
};

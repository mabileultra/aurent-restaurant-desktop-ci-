/** B0 — print job lifecycle. No I/O. Workers only touch print_jobs, never orders. */

const PRINT_JOB_STATUS = Object.freeze({
  PENDING: 'PENDING',
  PRINTING: 'PRINTING',
  PRINTED: 'PRINTED',
  FAILED: 'FAILED',
  UNKNOWN: 'UNKNOWN',
});

/** @type {Readonly<Record<string, ReadonlySet<string>>>} */
const PRINT_JOB_TRANSITIONS = Object.freeze({
  [PRINT_JOB_STATUS.PENDING]: Object.freeze(new Set([PRINT_JOB_STATUS.PRINTING])),
  [PRINT_JOB_STATUS.PRINTING]: Object.freeze(
    new Set([PRINT_JOB_STATUS.PRINTED, PRINT_JOB_STATUS.FAILED, PRINT_JOB_STATUS.UNKNOWN]),
  ),
  // Explicit user resolve only — never automatic from UNKNOWN/FAILED.
  [PRINT_JOB_STATUS.FAILED]: Object.freeze(new Set([PRINT_JOB_STATUS.PENDING])),
  [PRINT_JOB_STATUS.UNKNOWN]: Object.freeze(
    new Set([PRINT_JOB_STATUS.PENDING, PRINT_JOB_STATUS.PRINTED, PRINT_JOB_STATUS.FAILED]),
  ),
  [PRINT_JOB_STATUS.PRINTED]: Object.freeze(new Set()),
});

function canTransitionPrintJob(from, to) {
  const next = PRINT_JOB_TRANSITIONS[from];
  return Boolean(next && next.has(to));
}

function assertPrintJobTransition(from, to) {
  if (!canTransitionPrintJob(from, to)) {
    throw new Error(`invalid_print_job_transition:${from}->${to}`);
  }
  return to;
}

/** After crash/restart: stale PRINTING must become UNKNOWN, never PENDING. */
function resolveStalePrinting(status, startedAtMs, nowMs, staleAfterMs) {
  if (status !== PRINT_JOB_STATUS.PRINTING) return status;
  if (startedAtMs == null || nowMs - startedAtMs < staleAfterMs) return status;
  return PRINT_JOB_STATUS.UNKNOWN;
}

function allowsAutoPrintRetry(status) {
  return status === PRINT_JOB_STATUS.PENDING;
}

module.exports = {
  PRINT_JOB_STATUS,
  PRINT_JOB_TRANSITIONS,
  canTransitionPrintJob,
  assertPrintJobTransition,
  resolveStalePrinting,
  allowsAutoPrintRetry,
};

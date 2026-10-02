/**
 * Manual resolve for UNKNOWN (and FAILED→requeue) print jobs.
 * Never auto-called by workers.
 */
const { PRINT_JOB_STATUS } = require('../domain/printJobStatus.cjs');
const { createPrintJobRepo } = require('../db/printJobRepo.cjs');

const ACTIONS = Object.freeze({
  ACK_PRINTED: 'ACK_PRINTED',
  MARK_FAILED: 'MARK_FAILED',
  REQUEUE: 'REQUEUE',
});

function resolvePrintJobCommand(db, input = {}) {
  const jobId = String(input.jobId || input.id || '').trim();
  const action = String(input.action || '').trim().toUpperCase();
  if (!jobId) throw new Error('print_job_id_required');
  if (!ACTIONS[action]) throw new Error(`print_resolve_action_invalid:${action}`);

  const prints = createPrintJobRepo(db);
  const row = prints.getById(jobId);
  if (!row) throw new Error(`print_job_not_found:${jobId}`);

  if (action === ACTIONS.REQUEUE) {
    if (row.status !== PRINT_JOB_STATUS.UNKNOWN && row.status !== PRINT_JOB_STATUS.FAILED) {
      throw new Error(`print_resolve_not_allowed:${row.status}->REQUEUE`);
    }
    return {
      ...prints.transition(jobId, PRINT_JOB_STATUS.PENDING),
      action,
      previousStatus: row.status,
    };
  }

  if (row.status !== PRINT_JOB_STATUS.UNKNOWN) {
    throw new Error(`print_resolve_not_allowed:${row.status}->${action}`);
  }

  if (action === ACTIONS.ACK_PRINTED) {
    return {
      ...prints.transition(jobId, PRINT_JOB_STATUS.PRINTED),
      action,
      previousStatus: row.status,
    };
  }

  return {
    ...prints.transition(jobId, PRINT_JOB_STATUS.FAILED, {
      error: input.error || 'manual_mark_failed',
    }),
    action,
    previousStatus: row.status,
  };
}

function listUnresolvedPrintJobs(db, limit = 50) {
  const prints = createPrintJobRepo(db);
  return [
    ...prints.listByStatus(PRINT_JOB_STATUS.UNKNOWN, limit),
    ...prints.listByStatus(PRINT_JOB_STATUS.FAILED, limit),
  ].map((row) => ({
    id: row.id,
    orderId: row.order_id,
    kind: row.kind,
    printerName: row.printer_name,
    status: row.status,
    lastError: row.last_error,
    createdAt: row.created_at,
    startedAt: row.started_at,
  }));
}

module.exports = {
  ACTIONS,
  resolvePrintJobCommand,
  listUnresolvedPrintJobs,
};

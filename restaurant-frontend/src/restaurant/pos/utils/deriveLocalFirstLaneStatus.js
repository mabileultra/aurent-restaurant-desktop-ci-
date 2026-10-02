/**
 * Derive separate Kitchen (print) vs Sync lanes for local-first UI.
 * Classic mode callers should not use this — return null when not local-first.
 */

/**
 * @param {object} opts
 * @param {object|null} [opts.order] — may carry _localPrinted / _printFailed / _localOnly
 * @param {{ pendingPrintJobs?: number, unknownPrintJobs?: number, pendingOutbox?: number, failedPrintJobs?: number }|null} [opts.queues]
 * @param {boolean} [opts.localFirst]
 */
export function deriveLocalFirstLaneStatus({
  order = null,
  queues = null,
  localFirst = false,
} = {}) {
  if (!localFirst) return null;

  const pendingPrint = Number(queues?.pendingPrintJobs) || 0;
  const unknownPrint = Number(queues?.unknownPrintJobs) || 0;
  const failedPrint = Number(queues?.failedPrintJobs) || 0;
  const pendingOutbox = Number(queues?.pendingOutbox) || 0;

  const printFailedFlag = order?._printFailed === true;
  const localPrinted = order?._localPrinted === true;
  const localOnly = order?._localOnly === true;

  /** @type {'idle'|'saved'|'print_pending'|'printed'|'print_failed'|'print_unknown'} */
  let kitchen = 'idle';
  if (printFailedFlag || (failedPrint > 0 && localPrinted)) {
    kitchen = 'print_failed';
  } else if (unknownPrint > 0 && localPrinted) {
    kitchen = 'print_unknown';
  } else if (pendingPrint > 0) {
    kitchen = 'print_pending';
  } else if (localPrinted) {
    kitchen = 'printed';
  }

  /** @type {'idle'|'waiting'|'synced'} */
  let sync = 'idle';
  if (pendingOutbox > 0 || localOnly) {
    sync = 'waiting';
  } else if (localPrinted && !localOnly) {
    sync = 'synced';
  }

  const visible = kitchen !== 'idle' || sync !== 'idle' || pendingPrint > 0 || pendingOutbox > 0;
  return { kitchen, sync, visible, pendingPrint, pendingOutbox, unknownPrint, failedPrint };
}

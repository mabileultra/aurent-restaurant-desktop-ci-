/**
 * B0 — transaction boundary contract (documentation as code).
 * Commands own the TX; workers run only after COMMIT and only on their entity.
 */

const TX_WRITES = Object.freeze([
  'orders',
  'order_items',
  'print_jobs',
  'outbox',
]);

const PRINT_WORKER_MAY_WRITE = Object.freeze(['print_jobs']);
const SYNC_WORKER_MAY_WRITE = Object.freeze(['outbox', 'sync_state']);

/**
 * Vertical-slice command: send-to-kitchen must include all three in one COMMIT.
 * @returns {{ tables: string[], afterCommit: string[] }}
 */
function sendToKitchenTxPlan() {
  return {
    tables: ['order_items', 'orders', 'print_jobs', 'outbox'],
    afterCommit: ['print_worker', 'sync_worker'],
  };
}

function workerMayWrite(worker, table) {
  if (worker === 'print') return PRINT_WORKER_MAY_WRITE.includes(table);
  if (worker === 'sync') return SYNC_WORKER_MAY_WRITE.includes(table);
  return false;
}

module.exports = {
  TX_WRITES,
  PRINT_WORKER_MAY_WRITE,
  SYNC_WORKER_MAY_WRITE,
  sendToKitchenTxPlan,
  workerMayWrite,
};

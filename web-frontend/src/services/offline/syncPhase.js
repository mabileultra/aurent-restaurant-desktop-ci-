/** Sync progress phases shown on the cashier UI during reconnect / manual sync. */
export const SYNC_PHASE = {
  IDLE: 'idle',
  CHECKING: 'checking',
  CATALOG: 'catalog',
  SALES: 'sales',
  DONE: 'done',
  ERROR: 'error',
};

export const SYNC_PHASE_I18N = {
  [SYNC_PHASE.CHECKING]: 'offline.phaseChecking',
  [SYNC_PHASE.CATALOG]: 'offline.phaseCatalog',
  [SYNC_PHASE.SALES]: 'offline.phaseSales',
  [SYNC_PHASE.DONE]: 'offline.phaseDone',
  [SYNC_PHASE.ERROR]: 'offline.phaseError',
};

export function isActiveSyncPhase(phase) {
  return (
    phase === SYNC_PHASE.CHECKING
    || phase === SYNC_PHASE.CATALOG
    || phase === SYNC_PHASE.SALES
  );
}

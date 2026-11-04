import { useConnectivityStore } from '../store/connectivityStore';

/**
 * Before origin hop to p-aurent: IndexedDB/SW queues stay on aurent.
 * Block handoff while local pending sales exist (desktop offline outbox).
 */
export function getPharmacyHandoffDrainBlock() {
  const { pendingSales, syncing } = useConnectivityStore.getState();
  const pending = Number(pendingSales || 0);
  if (syncing) {
    return { blocked: true, reason: 'syncing', pending };
  }
  if (pending > 0) {
    return { blocked: true, reason: 'pending', pending };
  }
  return { blocked: false, reason: null, pending: 0 };
}

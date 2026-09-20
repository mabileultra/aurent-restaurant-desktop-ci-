import { useConnectivityStore } from '../../store/connectivityStore';

/**
 * Online sync only when API is known reachable.
 * Do NOT use navigator.onLine alone — macOS often stays "online" without DNS/internet.
 */
export function canRunOnlineSync(state = useConnectivityStore.getState()) {
  if (!state) return false;
  if (state.forceOfflineMode) return false;
  if (state.offlineMode) return false;
  if (!state.apiOnline) return false;
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return false;
  return true;
}

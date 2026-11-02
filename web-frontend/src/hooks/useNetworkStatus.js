import { useEffect } from 'react';
import { useNetworkStore, ConnectionStatus } from '../store/networkStore';

/**
 * Global tarmoq holati hooki (Zustand store delegatsiyasi)
 * Ilova bo'ylab yagona manbadan o'qiydi va bir xil holatni qaytaradi
 */
export function useNetworkStatus() {
  const status = useNetworkStore((s) => s.status);
  const isProbing = useNetworkStore((s) => s.isProbing);
  const checkConnection = useNetworkStore((s) => s.checkConnection);
  const dismissReconnected = useNetworkStore((s) => s.dismissReconnected);
  const startWatcher = useNetworkStore((s) => s.startWatcher);

  useEffect(() => {
    startWatcher();
  }, [startWatcher]);

  const isChecking = status === ConnectionStatus.CHECKING;
  const isOffline = status === ConnectionStatus.OFFLINE;
  const isServerDown = status === ConnectionStatus.SERVER_DOWN;
  const isReconnected = status === ConnectionStatus.RECONNECTED;
  const isOnline = status === ConnectionStatus.ONLINE || isReconnected;

  return {
    status,
    isOnline,
    isOffline,
    isServerDown,
    isChecking,
    isProbing,
    wasOffline: isReconnected,
    checkConnection,
    dismissReconnected,
  };
}

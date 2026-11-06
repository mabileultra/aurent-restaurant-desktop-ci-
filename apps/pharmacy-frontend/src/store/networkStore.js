import { create } from 'zustand';
import { onlineManager } from '@tanstack/react-query';
import {
  AURENT_NETWORK_OFFLINE_EVENT,
  AURENT_NETWORK_ONLINE_EVENT,
  isApiNetworkError,
} from '../utils/apiNetworkError';

export const ConnectionStatus = {
  ONLINE: 'ONLINE',
  CHECKING: 'CHECKING',
  OFFLINE: 'OFFLINE',
  SERVER_DOWN: 'SERVER_DOWN',
  RECONNECTED: 'RECONNECTED',
};

const HEALTH_PROBE_URL = '/api/v1/actuator/health';
const HEALTH_TIMEOUT_MS = 3_000;
const RECONNECT_AUTO_DISMISS_MS = 3_000;
const AUTO_POLL_INTERVAL_MS = 5_000;

export async function probeBackendHealth(timeoutMs = HEALTH_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${HEALTH_PROBE_URL}?_t=${Date.now()}`, {
      method: 'GET',
      cache: 'no-store',
      signal: controller.signal,
    });
    return Boolean(res && res.status >= 200 && res.status < 500);
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

function getInitialStatus() {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return ConnectionStatus.OFFLINE;
  }
  return ConnectionStatus.ONLINE;
}

export const useNetworkStore = create((set, get) => {
  let reconnectTimer = null;
  let autoPollTimer = null;
  let isWatcherStarted = false;
  let activeCheckPromise = null;
  let wasTrulyDisconnected = false;

  const clearTimers = () => {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  };

  const clearAutoPoll = () => {
    if (autoPollTimer) {
      clearInterval(autoPollTimer);
      autoPollTimer = null;
    }
  };

  const startAutoPoll = () => {
    if (autoPollTimer) return;
    autoPollTimer = setInterval(() => get().checkConnection(), AUTO_POLL_INTERVAL_MS);
  };

  const setStatus = (nextStatus) => {
    const prevStatus = get().status;
    if (prevStatus === nextStatus) return;

    clearTimers();

    if (nextStatus === ConnectionStatus.OFFLINE || nextStatus === ConnectionStatus.SERVER_DOWN) {
      wasTrulyDisconnected = true;
      startAutoPoll();
    } else if (nextStatus === ConnectionStatus.ONLINE) {
      wasTrulyDisconnected = false;
      clearAutoPoll();
    } else if (nextStatus === ConnectionStatus.RECONNECTED) {
      wasTrulyDisconnected = false;
      clearAutoPoll();
      reconnectTimer = setTimeout(() => set({ status: ConnectionStatus.ONLINE }), RECONNECT_AUTO_DISMISS_MS);
    }

    if (nextStatus === ConnectionStatus.OFFLINE) {
      onlineManager.setOnline(false);
    } else if (nextStatus === ConnectionStatus.ONLINE || nextStatus === ConnectionStatus.RECONNECTED) {
      onlineManager.setOnline(true);
    }

    set({ status: nextStatus, lastUpdated: new Date() });
  };

  const checkConnection = async () => {
    if (activeCheckPromise) return activeCheckPromise;

    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      setStatus(ConnectionStatus.OFFLINE);
      return false;
    }

    const currentStatus = get().status;
    const previouslyDisconnected =
      wasTrulyDisconnected ||
      currentStatus === ConnectionStatus.OFFLINE ||
      currentStatus === ConnectionStatus.SERVER_DOWN;

    // Agar allaqachon uzilish (OFFLINE/SERVER_DOWN) holatida bo'lsa,
    // holatni CHECKING ga o'zgartirmaymiz (miltillash va tugmalarni yoniq qolishini oldini oladi).
    if (!previouslyDisconnected) {
      set({ status: ConnectionStatus.CHECKING, isProbing: true });
    } else {
      set({ isProbing: true });
    }

    activeCheckPromise = (async () => {
      try {
        const isHealthy = await probeBackendHealth(HEALTH_TIMEOUT_MS);
        if (isHealthy) {
          setStatus(previouslyDisconnected ? ConnectionStatus.RECONNECTED : ConnectionStatus.ONLINE);
          return true;
        }

        const isBrowserOffline = typeof navigator !== 'undefined' && navigator.onLine === false;
        setStatus(isBrowserOffline ? ConnectionStatus.OFFLINE : ConnectionStatus.SERVER_DOWN);
        return false;
      } finally {
        set({ isProbing: false });
        activeCheckPromise = null;
      }
    })();

    return activeCheckPromise;
  };

  const handleBrowserOffline = () => {
    clearTimers();
    setStatus(ConnectionStatus.OFFLINE);
  };

  const handleApiError = (error) => {
    if (!isApiNetworkError(error)) return;
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      setStatus(ConnectionStatus.OFFLINE);
      return;
    }
    checkConnection();
  };

  const handleApiSuccess = () => {
    const current = get().status;
    if (current === ConnectionStatus.OFFLINE || current === ConnectionStatus.SERVER_DOWN) {
      setStatus(ConnectionStatus.RECONNECTED);
    }
  };

  const dismissReconnected = () => {
    clearTimers();
    set({ status: ConnectionStatus.ONLINE });
  };

  const startWatcher = () => {
    if (isWatcherStarted || typeof window === 'undefined') return;
    isWatcherStarted = true;

    window.addEventListener('offline', handleBrowserOffline);
    window.addEventListener('online', () => checkConnection());
    window.addEventListener(AURENT_NETWORK_OFFLINE_EVENT, (e) => handleApiError(e.detail));
    window.addEventListener(AURENT_NETWORK_ONLINE_EVENT, handleApiSuccess);
  };

  return {
    status: getInitialStatus(),
    isProbing: false,
    lastUpdated: new Date(),
    setStatus,
    checkConnection,
    dismissReconnected,
    handleApiError,
    handleApiSuccess,
    startWatcher,
  };
});

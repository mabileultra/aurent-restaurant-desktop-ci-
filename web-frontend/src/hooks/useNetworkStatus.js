import { useState, useEffect, useCallback, useRef } from 'react';
import { onlineManager } from '@tanstack/react-query';
import {
  AURENT_NETWORK_OFFLINE_EVENT,
  AURENT_NETWORK_ONLINE_EVENT,
} from '../utils/apiNetworkError';
import { probeReachable } from './probeReachable';

const OFFLINE_CONFIRM_MS = 15_000;
const OFFLINE_PROBE_GAP_MS = 4_000;

/**
 * Enterprise hook for tracking browser network connectivity and React Query sync.
 * - Tracks online / offline window events
 * - Probes the server before confirming offline to prevent false positives
 * - Listens to global Aurent API network failure/recovery events
 * - Syncs with TanStack React Query onlineManager
 * - Tracks `wasOffline` only when truly transitioning from offline to online
 * - Automatically hides reconnected banner after autoDismissOnlineAfterMs
 */
export function useNetworkStatus(options = {}) {
  const { probeUrl = '/favicon.svg', autoDismissOnlineAfterMs = 3500 } = options;

  const getInitialOnline = () => {
    if (typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean') {
      return navigator.onLine;
    }
    return true;
  };

  const initialOnline = getInitialOnline();
  const [isOnline, setIsOnline] = useState(initialOnline);
  const [wasOffline, setWasOffline] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [reconnectedAt, setReconnectedAt] = useState(null);
  const isOnlineRef = useRef(initialOnline);
  const autoDismissTimerRef = useRef(null);
  const confirmTokenRef = useRef(0);
  const confirmTimerRef = useRef(null);

  const clearDismissTimer = useCallback(() => {
    if (autoDismissTimerRef.current) {
      clearTimeout(autoDismissTimerRef.current);
      autoDismissTimerRef.current = null;
    }
  }, []);

  const clearConfirmTimer = useCallback(() => {
    if (confirmTimerRef.current) {
      clearTimeout(confirmTimerRef.current);
      confirmTimerRef.current = null;
    }
  }, []);

  const publishOnline = useCallback(
    (next) => {
      const prev = isOnlineRef.current;
      isOnlineRef.current = next;
      setIsOnline(next);
      onlineManager.setOnline(next);
      if (prev === next) return;
      if (!next) {
        clearDismissTimer();
        setWasOffline(false);
        return;
      }
      setWasOffline(true);
      setReconnectedAt(Date.now());
      clearDismissTimer();
      if (autoDismissOnlineAfterMs > 0) {
        autoDismissTimerRef.current = setTimeout(() => {
          setWasOffline(false);
        }, autoDismissOnlineAfterMs);
      }
    },
    [autoDismissOnlineAfterMs, clearDismissTimer],
  );

  const handleOnline = useCallback(() => {
    confirmTokenRef.current += 1;
    clearConfirmTimer();
    publishOnline(true);
  }, [clearConfirmTimer, publishOnline]);

  const handleOffline = useCallback(() => {
    const token = confirmTokenRef.current + 1;
    confirmTokenRef.current = token;
    const started = Date.now();

    const tick = async () => {
      if (confirmTokenRef.current !== token) return;
      const ok = await probeReachable(probeUrl);
      if (confirmTokenRef.current !== token) return;
      if (ok) {
        if (!isOnlineRef.current) publishOnline(true);
        return;
      }
      if (Date.now() - started >= OFFLINE_CONFIRM_MS) {
        publishOnline(false);
        return;
      }
      confirmTimerRef.current = window.setTimeout(tick, OFFLINE_PROBE_GAP_MS);
    };

    clearConfirmTimer();
    confirmTimerRef.current = window.setTimeout(tick, 1_000);
  }, [clearConfirmTimer, probeUrl, publishOnline]);

  const checkConnection = useCallback(async () => {
    setIsChecking(true);
    const reachable = await probeReachable(probeUrl);
    if (reachable) {
      handleOnline();
    } else {
      publishOnline(false);
    }
    setIsChecking(false);
    return reachable;
  }, [handleOnline, probeUrl, publishOnline]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const onCustomOffline = () => handleOffline();
    const onCustomOnline = () => handleOnline();
    const onWindowFocus = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        handleOffline();
      } else if (!isOnlineRef.current) {
        checkConnection();
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener(AURENT_NETWORK_OFFLINE_EVENT, onCustomOffline);
    window.addEventListener(AURENT_NETWORK_ONLINE_EVENT, onCustomOnline);
    window.addEventListener('focus', onWindowFocus);
    document.addEventListener('visibilitychange', onWindowFocus);

    onlineManager.setOnline(isOnlineRef.current);

    return () => {
      confirmTokenRef.current += 1;
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener(AURENT_NETWORK_OFFLINE_EVENT, onCustomOffline);
      window.removeEventListener(AURENT_NETWORK_ONLINE_EVENT, onCustomOnline);
      window.removeEventListener('focus', onWindowFocus);
      document.removeEventListener('visibilitychange', onWindowFocus);
      clearDismissTimer();
      clearConfirmTimer();
    };
  }, [handleOnline, handleOffline, checkConnection, clearDismissTimer, clearConfirmTimer]);

  // Periodic background probe ONLY while offline to automatically restore when connection is back
  useEffect(() => {
    if (isOnline) return undefined;

    const intervalId = setInterval(() => {
      checkConnection();
    }, 4000);

    return () => clearInterval(intervalId);
  }, [isOnline, checkConnection]);

  const dismissReconnected = useCallback(() => {
    clearDismissTimer();
    setWasOffline(false);
  }, [clearDismissTimer]);

  return {
    isOnline,
    isOffline: !isOnline,
    wasOffline,
    isChecking,
    reconnectedAt,
    checkConnection,
    dismissReconnected,
  };
}

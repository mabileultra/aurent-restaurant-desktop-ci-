import { useState, useEffect, useCallback, useRef } from 'react';
import { onlineManager } from '@tanstack/react-query';

/**
 * Enterprise hook for tracking browser network connectivity.
 * - Tracks online / offline window events
 * - Syncs with TanStack React Query onlineManager
 * - Tracks `wasOffline` to show smooth reconnection feedback
 * - Provides active connection probing via `checkConnection()`
 */
export function useNetworkStatus(options = {}) {
  const { probeUrl = '/api/v1/health', autoDismissOnlineAfterMs = 3500 } = options;

  const getInitialOnline = () => {
    if (typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean') {
      return navigator.onLine;
    }
    return true;
  };

  const [isOnline, setIsOnline] = useState(getInitialOnline);
  const [wasOffline, setWasOffline] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [reconnectedAt, setReconnectedAt] = useState(null);
  const autoDismissTimerRef = useRef(null);

  const clearDismissTimer = useCallback(() => {
    if (autoDismissTimerRef.current) {
      clearTimeout(autoDismissTimerRef.current);
      autoDismissTimerRef.current = null;
    }
  }, []);

  const handleOnline = useCallback(() => {
    setIsOnline(true);
    onlineManager.setOnline(true);
    setWasOffline(true);
    setReconnectedAt(Date.now());

    clearDismissTimer();
    if (autoDismissOnlineAfterMs > 0) {
      autoDismissTimerRef.current = setTimeout(() => {
        setWasOffline(false);
      }, autoDismissOnlineAfterMs);
    }
  }, [autoDismissOnlineAfterMs, clearDismissTimer]);

  const handleOffline = useCallback(() => {
    clearDismissTimer();
    setIsOnline(false);
    onlineManager.setOnline(false);
    setWasOffline(true);
  }, [clearDismissTimer]);

  // Active probe to confirm connection against server or lightweight endpoint
  const checkConnection = useCallback(async () => {
    setIsChecking(true);
    try {
      // If browser explicitly reports offline, no need to probe network
      if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        setIsOnline(false);
        onlineManager.setOnline(false);
        setIsChecking(false);
        return false;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(`${probeUrl}?_t=${Date.now()}`, {
        method: 'HEAD',
        cache: 'no-store',
        signal: controller.signal,
      }).catch(() => null);

      clearTimeout(timeoutId);

      // Status 200-399 or even 401/403/404 means the network & server are reachable!
      const reachable = Boolean(res && res.status > 0);
      if (reachable) {
        handleOnline();
      } else {
        // If probe completely failed without response, mark offline
        setIsOnline(false);
        onlineManager.setOnline(false);
      }
      setIsChecking(false);
      return reachable;
    } catch {
      setIsOnline(false);
      onlineManager.setOnline(false);
      setIsChecking(false);
      return false;
    }
  }, [handleOnline, probeUrl]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial sync with TanStack Query
    onlineManager.setOnline(getInitialOnline());

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearDismissTimer();
    };
  }, [handleOnline, handleOffline, clearDismissTimer]);

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

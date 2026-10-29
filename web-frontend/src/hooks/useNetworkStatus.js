import { useState, useEffect, useCallback, useRef } from 'react';
import { onlineManager } from '@tanstack/react-query';
import {
  AURENT_NETWORK_OFFLINE_EVENT,
  AURENT_NETWORK_ONLINE_EVENT,
} from '../utils/apiNetworkError';

/**
 * Enterprise hook for tracking browser network connectivity.
 * - Tracks online / offline window events
 * - Syncs with TanStack React Query onlineManager
 * - Listens to global Aurent API network failure/recovery events
 * - Auto-probes periodically during offline state for instant recovery
 * - Tracks `wasOffline` ONLY when truly transitioning from offline to online
 * - Automatically hides "tiklandi" banner after a short period without annoying flashes
 * - Provides active connection probing via `checkConnection()`
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

  const clearDismissTimer = useCallback(() => {
    if (autoDismissTimerRef.current) {
      clearTimeout(autoDismissTimerRef.current);
      autoDismissTimerRef.current = null;
    }
  }, []);

  const handleOnline = useCallback(() => {
    const previouslyOffline = !isOnlineRef.current;
    isOnlineRef.current = true;
    setIsOnline(true);
    onlineManager.setOnline(true);

    // ONLY show reconnected banner if user was truly offline before!
    if (previouslyOffline) {
      setWasOffline(true);
      setReconnectedAt(Date.now());

      clearDismissTimer();
      if (autoDismissOnlineAfterMs > 0) {
        autoDismissTimerRef.current = setTimeout(() => {
          setWasOffline(false);
        }, autoDismissOnlineAfterMs);
      }
    }
  }, [autoDismissOnlineAfterMs, clearDismissTimer]);

  const handleOffline = useCallback(() => {
    isOnlineRef.current = false;
    clearDismissTimer();
    setIsOnline(false);
    onlineManager.setOnline(false);
    // While offline, we are in offline mode, not reconnected mode
    setWasOffline(false);
  }, [clearDismissTimer]);

  // Active probe to confirm connection against server or lightweight endpoint
  const checkConnection = useCallback(async () => {
    setIsChecking(true);
    try {
      if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        handleOffline();
        setIsChecking(false);
        return false;
      }

      const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const timeoutId = setTimeout(() => {
        if (controller) controller.abort();
      }, 3500);

      // Lightweight probe: /favicon.svg is served directly by Nginx with 0 load
      const res = await fetch(`${probeUrl}?_t=${Date.now()}`, {
        method: 'HEAD',
        cache: 'no-store',
        signal: controller ? controller.signal : undefined,
      }).catch(() => null);

      clearTimeout(timeoutId);

      const reachable = Boolean(res && res.status > 0);
      if (reachable) {
        handleOnline();
      } else {
        handleOffline();
      }
      setIsChecking(false);
      return reachable;
    } catch {
      handleOffline();
      setIsChecking(false);
      return false;
    }
  }, [handleOnline, handleOffline, probeUrl]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const onCustomOffline = () => handleOffline();
    const onCustomOnline = () => handleOnline();
    const onWindowFocus = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        handleOffline();
      } else if (!isOnlineRef.current) {
        // Only probe if currently in offline state to verify if connection returned
        checkConnection();
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener(AURENT_NETWORK_OFFLINE_EVENT, onCustomOffline);
    window.addEventListener(AURENT_NETWORK_ONLINE_EVENT, onCustomOnline);
    window.addEventListener('focus', onWindowFocus);
    document.addEventListener('visibilitychange', onWindowFocus);

    // Initial sync with TanStack Query
    onlineManager.setOnline(initialOnline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener(AURENT_NETWORK_OFFLINE_EVENT, onCustomOffline);
      window.removeEventListener(AURENT_NETWORK_ONLINE_EVENT, onCustomOnline);
      window.removeEventListener('focus', onWindowFocus);
      document.removeEventListener('visibilitychange', onWindowFocus);
      clearDismissTimer();
    };
  }, [handleOnline, handleOffline, checkConnection, clearDismissTimer, initialOnline]);

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

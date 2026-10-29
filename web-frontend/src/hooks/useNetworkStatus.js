import { useState, useEffect, useCallback, useRef } from 'react';
import { onlineManager } from '@tanstack/react-query';
import { probeReachable } from './probeReachable';

const OFFLINE_CONFIRM_MS = 15_000;
const OFFLINE_PROBE_GAP_MS = 4_000;

/**
 * Сеть для баннера и React Query.
 * Событие offline браузера само по себе кассу не отключает:
 * сначала несколько проб, и только если сервер молчит ~15 с — офлайн.
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
  const onlineRef = useRef(getInitialOnline());
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

  const publishOnline = useCallback((next) => {
    const prev = onlineRef.current;
    onlineRef.current = next;
    setIsOnline(next);
    onlineManager.setOnline(next);
    if (prev === next) return;
    if (!next) {
      clearDismissTimer();
      setWasOffline(true);
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
  }, [autoDismissOnlineAfterMs, clearDismissTimer]);

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
        if (!onlineRef.current) publishOnline(true);
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
    if (reachable) handleOnline();
    setIsChecking(false);
    return reachable;
  }, [handleOnline, probeUrl]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    onlineManager.setOnline(onlineRef.current);

    return () => {
      confirmTokenRef.current += 1;
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearDismissTimer();
      clearConfirmTimer();
    };
  }, [handleOnline, handleOffline, clearDismissTimer, clearConfirmTimer]);

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

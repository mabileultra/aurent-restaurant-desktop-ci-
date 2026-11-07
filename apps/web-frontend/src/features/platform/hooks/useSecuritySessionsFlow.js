import { useMemo, useState } from 'react';

/**
 * Xavfsizlik "Kirishlar va seanslar" tabi mantiq hooki.
 * Backend seanslar API taqdim etilgunga qadar xavfsiz bo'sh holatda saqlanadi.
 */
export function useSecuritySessionsFlow() {
  const [filter, setFilter] = useState('all');
  const [pendingCloseSession, setPendingCloseSession] = useState(null);
  const [isCloseAllPending, setIsCloseAllPending] = useState(false);

  // Haqiqiy backend API bo'lmagani sababli bo'sh holat qaytariladi
  const sessions = useMemo(() => [], []);
  const attempts = useMemo(() => [], []);

  const requestCloseSession = (session) => {
    setPendingCloseSession(session);
  };

  const confirmCloseSession = () => {
    setPendingCloseSession(null);
  };

  const cancelCloseSession = () => {
    setPendingCloseSession(null);
  };

  const requestCloseAllOthers = () => {
    setIsCloseAllPending(true);
  };

  const confirmCloseAllOthers = () => {
    setIsCloseAllPending(false);
  };

  const cancelCloseAllOthers = () => {
    setIsCloseAllPending(false);
  };

  return {
    sessions,
    attempts,
    filter,
    setFilter,
    pendingCloseSession,
    requestCloseSession,
    confirmCloseSession,
    cancelCloseSession,
    isCloseAllPending,
    requestCloseAllOthers,
    confirmCloseAllOthers,
    cancelCloseAllOthers,
  };
}

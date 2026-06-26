import { useCallback, useEffect, useState } from 'react';
import { countUnseenPendingTickets, resolveLatestTicketTimestamp } from '../utils/kitchenDepartmentStats';

function loadSeenMap(storeId) {
  if (!storeId) return {};
  try {
    const raw = localStorage.getItem(`kitchen-kds-seen-${storeId}`);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveSeenMap(storeId, map) {
  if (!storeId) return;
  try {
    localStorage.setItem(`kitchen-kds-seen-${storeId}`, JSON.stringify(map));
  } catch {
    // ignore quota errors
  }
}

export function useKitchenSeenState(storeId) {
  const [seenAtByDepartment, setSeenAtByDepartment] = useState(() => loadSeenMap(storeId));

  useEffect(() => {
    setSeenAtByDepartment(loadSeenMap(storeId));
  }, [storeId]);

  useEffect(() => {
    saveSeenMap(storeId, seenAtByDepartment);
  }, [storeId, seenAtByDepartment]);

  const getUnseenCount = useCallback((department, tickets = []) => {
    return countUnseenPendingTickets(tickets, seenAtByDepartment[department]);
  }, [seenAtByDepartment]);

  const markDepartmentSeen = useCallback((department, tickets = []) => {
    const stamp = resolveLatestTicketTimestamp(tickets) ?? new Date().toISOString();
    setSeenAtByDepartment((prev) => ({
      ...prev,
      [department]: stamp,
    }));
  }, []);

  return {
    getUnseenCount,
    markDepartmentSeen,
  };
}

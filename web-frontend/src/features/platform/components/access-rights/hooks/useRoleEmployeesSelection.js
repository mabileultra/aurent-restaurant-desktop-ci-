import { useState, useCallback } from 'react';

/**
 * Xodimlar ro'yxatida bir nechta xodimni tanlash (multi-select) hooki (SRP)
 */
export function useRoleEmployeesSelection(filteredUsers = []) {
  const [selectedUserIds, setSelectedUserIds] = useState(() => new Set());

  const toggleSelect = useCallback((userId) => {
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  }, []);

  const selectAll = useCallback((checked) => {
    if (!checked) {
      setSelectedUserIds(new Set());
      return;
    }
    const all = new Set(filteredUsers.map((u) => u.userId || u.id));
    setSelectedUserIds(all);
  }, [filteredUsers]);

  const clearSelection = useCallback(() => {
    setSelectedUserIds(new Set());
  }, []);

  const isAllSelected = filteredUsers.length > 0 && filteredUsers.every((u) => selectedUserIds.has(u.userId || u.id));

  return {
    selectedUserIds,
    toggleSelect,
    selectAll,
    clearSelection,
    isAllSelected,
  };
}

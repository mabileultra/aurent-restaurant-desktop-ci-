import { useCallback, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { userApi } from '../../../../api';

/**
 * useUsersBulkActions
 * Hook managing user selection, bulk active/inactive toggling, and CSV export.
 */
export function useUsersBulkActions({ pageRows = [], currentUserId, currentUsername, qc, t }) {
  const [selectedUserIds, setSelectedUserIds] = useState(() => new Set());
  const [isAllMatchingSelected, setIsAllMatchingSelected] = useState(false);

  const handleToggleSelectAll = useCallback((checked) => {
    if (checked) {
      setSelectedUserIds(new Set(pageRows.map((u) => String(u.id))));
    } else {
      setSelectedUserIds(new Set());
      setIsAllMatchingSelected(false);
    }
  }, [pageRows]);

  const handleToggleSelectUser = useCallback((userId) => {
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      const strId = String(userId);
      if (next.has(strId)) next.delete(strId);
      else next.add(strId);
      return next;
    });
    setIsAllMatchingSelected(false);
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelectedUserIds(new Set());
    setIsAllMatchingSelected(false);
  }, []);

  const handleSelectAllMatching = useCallback(() => {
    setSelectedUserIds(new Set(pageRows.map((u) => String(u.id))));
    setIsAllMatchingSelected(true);
  }, [pageRows]);

  const selectedUsersList = useMemo(() => {
    if (!selectedUserIds.size) return [];
    return pageRows.filter((u) => selectedUserIds.has(String(u.id)));
  }, [pageRows, selectedUserIds]);

  const hasInactiveSelected = useMemo(
    () => selectedUsersList.some((u) => !u.active),
    [selectedUsersList]
  );
  const hasActiveSelected = useMemo(
    () => selectedUsersList.some((u) => u.active),
    [selectedUsersList]
  );

  const handleBulkToggleActive = useCallback(async (targetActive) => {
    const ids = Array.from(selectedUserIds);
    if (!ids.length) return;
    let usersToToggle = pageRows.filter(
      (u) => selectedUserIds.has(String(u.id)) && Boolean(u.active) !== Boolean(targetActive)
    );

    // Prevent self-deactivation during bulk deactivation
    if (!targetActive) {
      const filtered = usersToToggle.filter((u) => {
        const isSelf = (currentUserId && String(u.id) === String(currentUserId)) ||
          (currentUsername && u.username && u.username.toLowerCase() === currentUsername.toLowerCase());
        return !isSelf;
      });
      if (filtered.length < usersToToggle.length) {
        toast.error(t('users.selfExcludedFromBulkDeactivation', {
          defaultValue: 'O‘zingizning hisobingiz faolsizlantirishdan chiqarildi',
        }));
      }
      usersToToggle = filtered;
    }

    if (!usersToToggle.length) {
      toast.success(t('users.bulkAlreadyInState', { defaultValue: 'Tanlangan barcha foydalanuvchilar allaqachon ushbu holatda' }));
      setSelectedUserIds(new Set());
      return;
    }

    try {
      await Promise.all(usersToToggle.map((u) => userApi.toggle(u.id)));
      qc.invalidateQueries({ queryKey: ['users'] });
      toast.success(t('users.bulkUpdated', { count: usersToToggle.length, defaultValue: `${usersToToggle.length} ta foydalanuvchi holati yangilandi` }));
      setSelectedUserIds(new Set());
      setIsAllMatchingSelected(false);
    } catch {
      toast.error(t('users.bulkUpdateFailed', { defaultValue: 'Ommaviy yangilashda xatolik yuz berdi' }));
    }
  }, [selectedUserIds, pageRows, currentUserId, currentUsername, qc, t]);

  const handleExportSelectedCsv = useCallback(() => {
    const targetUsers = pageRows.filter((u) => selectedUserIds.has(String(u.id)));
    if (!targetUsers.length) return;

    const headers = ['ID', 'FIO', 'Login', 'Telefon', 'Email', 'Rol', 'Kompaniya', 'Filiallar', 'Holat', 'Yaratilgan'];
    const rows = targetUsers.map((u) => {
      let safeDate = '';
      if (u.createdAt) {
        try {
          const d = new Date(u.createdAt);
          if (!Number.isNaN(d.getTime())) safeDate = d.toISOString();
        } catch {
          safeDate = '';
        }
      }
      return [
        u.id,
        `"${(u.fullName || '').replace(/"/g, '""')}"`,
        `"${u.username || ''}"`,
        `"${u.phone || ''}"`,
        `"${u.email || ''}"`,
        `"${u.role || ''}"`,
        `"${(u.companyName || '').replace(/"/g, '""')}"`,
        `"${(u.storeNames || []).join(', ').replace(/"/g, '""')}"`,
        u.active ? 'Faol' : 'Nofaol',
        safeDate,
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `foydalanuvchilar_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(t('users.csvExported', { count: targetUsers.length, defaultValue: `${targetUsers.length} ta foydalanuvchi CSV formatida yuklab olindi` }));
  }, [pageRows, selectedUserIds, t]);

  return {
    selectedUserIds,
    setSelectedUserIds,
    handleToggleSelectAll,
    handleToggleSelectUser,
    handleClearSelection,
    handleSelectAllMatching,
    isAllMatchingSelected,
    hasInactiveSelected,
    hasActiveSelected,
    handleBulkToggleActive,
    handleExportSelectedCsv,
  };
}

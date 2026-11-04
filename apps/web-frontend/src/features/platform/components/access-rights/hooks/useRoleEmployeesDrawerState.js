import { useState, useEffect, useRef } from 'react';

/**
 * RoleEmployeesDrawer dialog va lifecycle boshqaruvi hooki (SRP)
 */
export function useRoleEmployeesDrawerState({
  isOpen,
  clearSelection,
  onResetUserToTemplate,
}) {
  const [confirmUser, setConfirmUser] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const triggerElementRef = useRef(null);
  const closeButtonRef = useRef(null);
  const drawerRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      triggerElementRef.current = document.activeElement;
      setConfirmUser(null);
      setEditingUser(null);
      setIsBulkOpen(false);
      clearSelection?.();

      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      const timer = setTimeout(() => closeButtonRef.current?.focus(), 50);

      return () => {
        clearTimeout(timer);
        document.body.style.overflow = originalOverflow;
        triggerElementRef.current?.focus?.();
      };
    }
    return undefined;
  }, [isOpen, clearSelection]);

  const handleConfirmReset = async () => {
    if (!confirmUser || isResetting) return;
    try {
      setIsResetting(true);
      const userId = confirmUser.userId || confirmUser.id;
      await onResetUserToTemplate?.(userId);
      setConfirmUser(null);
    } finally {
      setIsResetting(false);
    }
  };

  return {
    confirmUser,
    setConfirmUser,
    editingUser,
    setEditingUser,
    isBulkOpen,
    setIsBulkOpen,
    isResetting,
    handleConfirmReset,
    closeButtonRef,
    drawerRef,
  };
}

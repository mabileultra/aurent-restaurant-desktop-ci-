import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { userApi } from '../../../../api';

/**
 * useUsersPageModals
 * Manages modal dialogs (create/edit form, toggle active, delete confirm) and quick drawer.
 */
export function useUsersPageModals({ t }) {
  const qc = useQueryClient();

  const [formMode, setFormMode] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toggleTarget, setToggleTarget] = useState(null);
  const [drawerUser, setDrawerUser] = useState(null);

  const modalOpen = formMode !== null;
  const modalMode = formMode === 'create' ? 'create' : 'edit';
  const editingUser = typeof formMode === 'object' && formMode !== null ? formMode.user : null;

  const openCreate = () => setFormMode('create');
  const openEdit = (user, opts = {}) => setFormMode({ type: 'edit', user: { ...user, ...opts } });
  const closeModal = () => setFormMode(null);

  const openDelete = (user) => setDeleteTarget(user);
  const closeDelete = () => setDeleteTarget(null);

  const openToggleActive = (user) => setToggleTarget(user);
  const closeToggleActive = () => setToggleTarget(null);

  const openDrawer = (user) => setDrawerUser(user);
  const closeDrawer = () => setDrawerUser(null);

  const { mutate: toggleUser, isPending: isTogglePending } = useMutation({
    mutationFn: (target) => userApi.toggle(typeof target === 'object' ? target.id : target),
    onSuccess: (_, target) => {
      qc.invalidateQueries({ queryKey: ['users'] });
      const wasActive = typeof target === 'object' ? target.active : null;
      if (wasActive === true) {
        toast.success(t('users.deactivatedSuccess', { defaultValue: 'Foydalanuvchi faolsizlantirildi' }));
      } else if (wasActive === false) {
        toast.success(t('users.activatedSuccess', { defaultValue: 'Foydalanuvchi muvaffaqiyatli faollashtirildi' }));
      } else {
        toast.success(t('users.updated'));
      }
      setToggleTarget(null);
      if (drawerUser && drawerUser.id === (typeof target === 'object' ? target.id : target)) {
        setDrawerUser((prev) => (prev ? { ...prev, active: !prev.active } : null));
      }
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message ?? t('users.updateFailed', { defaultValue: 'Foydalanuvchi holatini o‘zgartirishda xatolik' }));
    },
  });

  const confirmToggleActive = (user) => {
    if (user) toggleUser(user);
  };

  const { mutate: deleteUser, isPending: isDeletePending } = useMutation({
    mutationFn: (id) => userApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      toast.success(t('users.deleted'));
      setDeleteTarget(null);
      setDrawerUser(null);
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message ?? t('users.deleteFailed'));
    },
  });

  const confirmDelete = () => {
    if (deleteTarget?.id) deleteUser(deleteTarget.id);
  };

  return {
    formMode,
    modalOpen,
    modalMode,
    editingUser,
    openCreate,
    openEdit,
    closeModal,
    deleteTarget,
    openDelete,
    closeDelete,
    confirmDelete,
    isDeletePending,
    toggleTarget,
    openToggleActive,
    closeToggleActive,
    confirmToggleActive,
    isTogglePending,
    drawerUser,
    openDrawer,
    closeDrawer,
    qc,
  };
}

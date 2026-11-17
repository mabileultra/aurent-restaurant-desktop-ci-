import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';

export function useFinanceRecordForm({
  emptyForm,
  createFn,
  updateFn,
  invalidate,
  formatSubmitPayload,
  isEditableFn,
  mapRowToForm,
  t,
  createdToastKey,
  updatedToastKey,
  onCreatedSuccess,
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const createMutation = useMutation({
    mutationFn: (payload) => createFn(payload),
    onSuccess: () => {
      invalidate();
      onCreatedSuccess?.();
      setModalOpen(false);
      resetForm();
      toast.success(t(createdToastKey));
    },
    onError: (err) => toast.error(err.response?.data?.message ?? t('common.saveError')),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => updateFn(id, payload),
    onSuccess: () => {
      invalidate();
      setModalOpen(false);
      resetForm();
      toast.success(t(updatedToastKey));
    },
    onError: (err) => toast.error(err.response?.data?.message ?? t('common.saveError')),
  });

  const openEdit = (row) => {
    if (!isEditableFn(row)) return;
    setEditingId(row.id);
    setForm(mapRowToForm(row));
    setModalOpen(true);
  };

  const submit = () => {
    const payload = formatSubmitPayload(form);
    if (editingId) {
      updateMutation.mutate({ id: editingId, payload });
      return;
    }
    createMutation.mutate({ ...payload, sourceType: 'MANUAL' });
  };

  return {
    modalOpen,
    setModalOpen,
    editingId,
    form,
    setForm,
    resetForm,
    openEdit,
    submit,
    createMutation,
    updateMutation,
  };
}

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { supplierApi } from '../../../api/supplier.api';

export function useSupplierRowActions() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [editSupplier, setEditSupplier] = useState(null);

  const deleteMutation = useMutation({
    mutationFn: (id) => supplierApi.remove(id),
    onSuccess: () => {
      toast.success(t('suppliersModule.deletedOk'));
      qc.invalidateQueries({ queryKey: ['suppliers'] });
      qc.invalidateQueries({ queryKey: ['suppliers-all'] });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message ?? t('suppliersModule.deletedFail'));
    },
  });

  const confirmDelete = (row) => {
    const ok = window.confirm(t('suppliersModule.deleteConfirm', { name: row.name || '' }));
    if (!ok) return;
    deleteMutation.mutate(row.id);
  };

  return {
    menuOpenId,
    setMenuOpenId,
    editSupplier,
    setEditSupplier,
    openEdit: (row) => setEditSupplier(row),
    closeEdit: () => setEditSupplier(null),
    confirmDelete,
    deletingId: deleteMutation.isPending ? deleteMutation.variables : null,
  };
}

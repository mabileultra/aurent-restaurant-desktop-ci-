import { useCallback, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { restaurantApi } from '../../../api';

const emptyForm = () => ({
  value: '',
  label: '',
  sortOrder: '',
});

export function useKitchenDepartments(canManage) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [modal, setModal] = useState(null);

  const departmentsQuery = useQuery({
    queryKey: ['kitchen-departments'],
    queryFn: () => restaurantApi.listKitchenDepartments().then((r) => r.data),
  });

  const invalidate = useCallback(() => {
    qc.invalidateQueries({ queryKey: ['kitchen-departments'] });
  }, [qc]);

  const saveMutation = useMutation({
    mutationFn: (payload) => {
      const body = {
        value: payload.value.trim(),
        label: payload.label.trim(),
        sortOrder: payload.sortOrder ? Number(payload.sortOrder) : undefined,
      };
      if (payload.id) {
        return restaurantApi.updateKitchenDepartment(payload.id, body);
      }
      return restaurantApi.createKitchenDepartment(body);
    },
    onSuccess: () => {
      toast.success(t('restaurantKitchen.departmentSaved'));
      setModal(null);
      invalidate();
    },
    onError: (err) => toast.error(err?.response?.data?.message ?? t('restaurantKitchen.departmentSaveFailed')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => restaurantApi.deleteKitchenDepartment(id),
    onSuccess: () => {
      toast.success(t('restaurantKitchen.departmentDeleted'));
      invalidate();
    },
    onError: (err) => toast.error(err?.response?.data?.message ?? t('restaurantKitchen.departmentDeleteFailed')),
  });

  const openCreate = () => setModal({ mode: 'create', form: emptyForm() });

  const openEdit = (dep) => setModal({
    mode: 'edit',
    id: dep.id,
    form: {
      value: dep.value,
      label: dep.label,
      sortOrder: dep.sortOrder ? String(dep.sortOrder) : '',
    },
  });

  const confirmDelete = (dep) => {
    if (!window.confirm(t('restaurantKitchen.departmentDeleteConfirm', { name: dep.label }))) return;
    deleteMutation.mutate(dep.id);
  };

  return {
    t,
    canManage,
    departments: departmentsQuery.data ?? [],
    departmentsLoading: departmentsQuery.isPending,
    modal,
    setModal,
    openCreate,
    openEdit,
    confirmDelete,
    saveMutation,
    deleteMutation,
  };
}

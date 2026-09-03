import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { rstKitchenApi } from '../../api/kitchen.api';
import { rstMenuApi } from '../../api/menu.api';
import { rstModifierApi } from '../../api/modifier.api';
import { useRestaurantWorkspaceStore } from '../../shared/hooks/useRestaurantWorkspaceStore';

const emptyForm = () => ({
  name: '',
  sku: '',
  price: '',
  available: true,
  sortOrder: 100,
  stationId: '',
  modifierGroupIds: [],
});

export function useMenuAdminPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const workspace = useRestaurantWorkspaceStore();
  const [form, setForm] = useState(emptyForm());
  const [editingId, setEditingId] = useState(null);

  const itemsQuery = useQuery({
    queryKey: ['rst-menu-admin', workspace.storeId],
    queryFn: () => rstMenuApi.list(workspace.storeId, false).then((r) => r.data),
    enabled: workspace.storeId != null,
  });

  const stationsQuery = useQuery({
    queryKey: ['rst-stations', workspace.storeId],
    queryFn: () => rstKitchenApi.listStations(workspace.storeId, true).then((r) => r.data),
    enabled: workspace.storeId != null,
  });

  const groupsQuery = useQuery({
    queryKey: ['rst-modifiers', workspace.storeId],
    queryFn: () => rstModifierApi.listGroups(workspace.storeId).then((r) => r.data),
    enabled: workspace.storeId != null,
  });

  const saveMutation = useMutation({
    mutationFn: () => {
      const body = {
        name: form.name,
        sku: form.sku || null,
        price: Number(form.price),
        available: form.available,
        sortOrder: Number(form.sortOrder) || 100,
        itemType: 'DISH',
        stationId: form.stationId || null,
        modifierGroupIds: form.modifierGroupIds,
      };
      if (editingId) return rstMenuApi.update(editingId, body);
      return rstMenuApi.create(workspace.storeId, body);
    },
    onSuccess: () => {
      toast.success(t('rst.admin.menuSaved'));
      setForm(emptyForm());
      setEditingId(null);
      qc.invalidateQueries({ queryKey: ['rst-menu-admin', workspace.storeId] });
      qc.invalidateQueries({ queryKey: ['rst-menu-pos', workspace.storeId] });
    },
    onError: (err) => toast.error(err?.response?.data?.message ?? t('rst.admin.saveFailed')),
  });

  const deactivateMutation = useMutation({
    mutationFn: (itemId) => rstMenuApi.deactivate(itemId),
    onSuccess: () => {
      toast.success(t('rst.admin.menuDeactivated'));
      qc.invalidateQueries({ queryKey: ['rst-menu-admin', workspace.storeId] });
      qc.invalidateQueries({ queryKey: ['rst-menu-pos', workspace.storeId] });
    },
    onError: (err) => toast.error(err?.response?.data?.message ?? t('rst.admin.deleteFailed')),
  });

  const startEdit = (item) => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      sku: item.sku ?? '',
      price: String(item.price ?? ''),
      available: item.available,
      sortOrder: item.sortOrder,
      stationId: item.stationId ?? '',
      modifierGroupIds: item.modifierGroupIds ?? [],
    });
  };

  const toggleGroup = (groupId) => {
    const current = form.modifierGroupIds ?? [];
    setForm({
      ...form,
      modifierGroupIds: current.includes(groupId)
        ? current.filter((id) => id !== groupId)
        : [...current, groupId],
    });
  };

  return {
    t,
    workspace,
    items: itemsQuery.data ?? [],
    stations: stationsQuery.data ?? [],
    groups: (groupsQuery.data ?? []).filter((group) => group.active),
    form,
    setForm,
    editingId,
    setEditingId,
    saveMutation,
    deactivateMutation,
    startEdit,
    toggleGroup,
    resetForm: () => {
      setEditingId(null);
      setForm(emptyForm());
    },
  };
}

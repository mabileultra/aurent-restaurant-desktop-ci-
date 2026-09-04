import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { rstKitchenApi } from '../../api/kitchen.api';
import { rstMenuApi } from '../../api/menu.api';
import { rstModifierApi } from '../../api/modifier.api';
import { useRestaurantWorkspaceStore } from '../../shared/hooks/useRestaurantWorkspaceStore';
import { readImageDataUrl } from '../../../utils/readImageDataUrl';

const emptyForm = () => ({
  name: '',
  sku: '',
  price: '',
  available: true,
  sortOrder: 100,
  stationId: '',
  category: '',
  imageUrl: '',
  imageName: '',
  modifierGroupIds: [],
});

const emptyFilters = () => ({
  search: '',
  category: '',
  stationId: '',
  availability: 'all',
});

export const MENU_CARD_PAGE_SIZE = 12;

export function useMenuAdminPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const workspace = useRestaurantWorkspaceStore();
  const [form, setForm] = useState(emptyForm());
  const [editingId, setEditingId] = useState(null);
  const [filters, setFilters] = useState(emptyFilters());

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

  const stations = stationsQuery.data ?? [];
  const items = useMemo(
    () => (itemsQuery.data ?? []).filter((item) => item.active),
    [itemsQuery.data],
  );

  const categories = useMemo(() => {
    const set = new Set();
    for (const item of items) {
      const value = String(item.category ?? '').trim();
      if (value) set.add(value);
    }
    return [...set].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
  }, [items]);

  const filteredItems = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    return items.filter((item) => {
      if (filters.category && String(item.category ?? '') !== filters.category) return false;
      if (filters.stationId && String(item.stationId ?? '') !== filters.stationId) return false;
      if (filters.availability === 'available' && !item.available) return false;
      if (filters.availability === 'unavailable' && item.available) return false;
      if (!q) return true;
      const hay = `${item.name ?? ''} ${item.sku ?? ''} ${item.category ?? ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [items, filters]);

  const filterKey = [
    workspace.storeId,
    filters.search,
    filters.category,
    filters.stationId,
    filters.availability,
  ].join('|');

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['rst-menu-admin', workspace.storeId] });
    qc.invalidateQueries({ queryKey: ['rst-menu-pos', workspace.storeId] });
  };

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
        category: form.category.trim() || null,
        imageUrl: form.imageUrl || null,
        modifierGroupIds: form.modifierGroupIds,
      };
      if (editingId) return rstMenuApi.update(editingId, body);
      return rstMenuApi.create(workspace.storeId, body);
    },
    onSuccess: () => {
      toast.success(t('rst.admin.menuSaved'));
      setForm(emptyForm());
      setEditingId(null);
      invalidate();
    },
    onError: (err) => toast.error(err?.response?.data?.message ?? t('rst.admin.saveFailed')),
  });

  const deactivateMutation = useMutation({
    mutationFn: (itemId) => rstMenuApi.deactivate(itemId),
    onSuccess: () => {
      toast.success(t('rst.admin.menuDeactivated'));
      invalidate();
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
      category: item.category ?? '',
      imageUrl: item.imageUrl ?? '',
      imageName: item.imageUrl ? t('rst.admin.imageAttached') : '',
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

  const onImageFile = async (file) => {
    if (!file) return;
    try {
      const dataUrl = await readImageDataUrl(file, 400 * 1024);
      setForm((current) => ({ ...current, imageUrl: dataUrl, imageName: file.name }));
    } catch {
      toast.error(t('rst.admin.imageUploadFailed'));
    }
  };

  const stationName = (stationId) => stations.find((s) => s.id === stationId)?.name ?? '';

  return {
    t,
    workspace,
    items,
    filteredItems,
    filterKey,
    stations,
    categories,
    groups: (groupsQuery.data ?? []).filter((group) => group.active),
    filters,
    setFilters,
    resetFilters: () => setFilters(emptyFilters()),
    form,
    setForm,
    editingId,
    setEditingId,
    saveMutation,
    deactivateMutation,
    startEdit,
    toggleGroup,
    onImageFile,
    stationName,
    isLoading: workspace.isLoading || itemsQuery.isLoading,
    resetForm: () => {
      setEditingId(null);
      setForm(emptyForm());
    },
  };
}

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { rstKitchenApi } from '../../api/kitchen.api';
import { rstMenuApi } from '../../api/menu.api';
import { rstModifierApi } from '../../api/modifier.api';
import { useRestaurantWorkspaceStore } from '../../shared/hooks/useRestaurantWorkspaceStore';
import { readImageDataUrl } from '../../../utils/readImageDataUrl';
import { toastApiError } from '../../../utils/apiError';

const emptyForm = () => ({
  name: '',
  sku: '',
  price: '',
  taxRate: '0',
  available: true,
  sortOrder: 100,
  stationId: '',
  menuCategoryId: '',
  imageUrl: '',
  imageName: '',
  description: '',
  prepMinutes: '',
  portionAmount: '',
  portionUnit: 'PORTION',
  portionLabel: '',
  tags: '',
  modifierGroupIds: [],
});

const emptyFilters = () => ({
  search: '',
  category: '',
  stationId: '',
  availability: 'all',
});

const emptyVariantForm = () => ({
  price: '',
  portionAmount: '',
  portionUnit: 'PORTION',
  portionLabel: '',
  sku: '',
});

export const MENU_PAGE_SIZE_OPTIONS = [10, 14, 20];
const DEFAULT_PAGE_SIZE = 14;

export function useMenuAdminPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const workspace = useRestaurantWorkspaceStore();
  const [form, setForm] = useState(emptyForm());
  const [editingId, setEditingId] = useState(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [filters, setFilters] = useState(emptyFilters());
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [variantSource, setVariantSource] = useState(null);
  const [variantForm, setVariantForm] = useState(emptyVariantForm);

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

  const menuCategoriesQuery = useQuery({
    queryKey: ['rst-menu-categories', workspace.storeId],
    queryFn: () => rstMenuApi.listCategories(workspace.storeId, true).then((r) => r.data),
    enabled: workspace.storeId != null,
  });

  const stations = stationsQuery.data ?? [];
  const menuCategories = menuCategoriesQuery.data ?? [];
  const items = useMemo(
    () => (itemsQuery.data ?? []).filter((item) => item.active),
    [itemsQuery.data],
  );

  const categories = useMemo(
    () => menuCategories.map((row) => row.name),
    [menuCategories],
  );

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

  const total = filteredItems.length;
  const totalPages = pageSize > 0 ? Math.max(1, Math.ceil(total / pageSize)) : 1;
  const safePage = Math.min(page, Math.max(0, totalPages - 1));
  const rows = useMemo(() => {
    const start = safePage * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, safePage, pageSize]);

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
        taxRate: Number(form.taxRate) || 0,
        available: form.available,
        sortOrder: Number(form.sortOrder) || 100,
        itemType: 'DISH',
        stationId: form.stationId || null,
        menuCategoryId: form.menuCategoryId || null,
        imageUrl: form.imageUrl || null,
        description: form.description.trim() || null,
        prepMinutes: form.prepMinutes === '' ? null : Number(form.prepMinutes),
        portionAmount: form.portionAmount === '' ? null : Number(form.portionAmount),
        portionUnit: form.portionAmount === '' ? null : (form.portionUnit || 'PORTION'),
        portionLabel: form.portionLabel.trim() || null,
        tags: form.tags.trim() || null,
        modifierGroupIds: form.modifierGroupIds,
      };
      if (editingId) return rstMenuApi.update(editingId, body);
      return rstMenuApi.create(workspace.storeId, body);
    },
    onSuccess: () => {
      toast.success(t('rst.admin.menuSaved'));
      setForm(emptyForm());
      setEditingId(null);
      setComposerOpen(false);
      invalidate();
    },
    onError: (err) => toastApiError(err, t('rst.admin.saveFailed')),
  });

  const deactivateMutation = useMutation({
    mutationFn: (itemId) => rstMenuApi.deactivate(itemId),
    onSuccess: () => {
      toast.success(t('rst.admin.menuDeactivated'));
      invalidate();
    },
    onError: (err) => toastApiError(err, t('rst.admin.deleteFailed')),
  });

  const createVariantMutation = useMutation({
    mutationFn: () => rstMenuApi.createVariant(variantSource.id, {
      price: Number(variantForm.price),
      portionAmount: variantForm.portionAmount === '' ? null : Number(variantForm.portionAmount),
      portionUnit: variantForm.portionAmount === '' ? null : (variantForm.portionUnit || 'PORTION'),
      portionLabel: variantForm.portionLabel.trim() || null,
      sku: variantForm.sku.trim() || null,
    }),
    onSuccess: () => {
      toast.success(t('rst.admin.variantCreated'));
      setVariantSource(null);
      invalidate();
    },
    onError: (err) => toastApiError(err, t('rst.admin.saveFailed')),
  });

  const openVariantForm = (item) => {
    setVariantSource(item);
    setVariantForm({ ...emptyVariantForm(), price: String(item.price ?? '') });
  };

  const closeComposer = () => {
    setEditingId(null);
    setForm(emptyForm());
    setComposerOpen(false);
  };

  const openComposer = () => {
    setEditingId(null);
    setForm(emptyForm());
    setComposerOpen(true);
  };

  const startEdit = (item) => {
    setComposerOpen(true);
    setEditingId(item.id);
    setForm({
      name: item.name,
      sku: item.sku ?? '',
      price: String(item.price ?? ''),
      taxRate: String(item.taxRate ?? 0),
      available: item.available,
      sortOrder: item.sortOrder,
      stationId: item.stationId ?? '',
      menuCategoryId: item.menuCategoryId ?? '',
      imageUrl: item.imageUrl ?? '',
      imageName: item.imageUrl ? t('rst.admin.imageAttached') : '',
      description: item.description ?? '',
      prepMinutes: item.prepMinutes == null ? '' : String(item.prepMinutes),
      portionAmount: item.portionAmount != null
        ? String(item.portionAmount)
        : (item.portionGrams != null ? String(item.portionGrams) : ''),
      portionUnit: item.portionUnit
        || (item.portionGrams != null ? 'G' : 'PORTION'),
      portionLabel: item.portionLabel ?? '',
      tags: item.tags ?? '',
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
    rows,
    stations,
    menuCategories,
    categories,
    groups: (groupsQuery.data ?? []).filter((group) => group.active),
    filters,
    setFilters: (next) => {
      setFilters(next);
      setPage(0);
    },
    resetFilters: () => {
      setFilters(emptyFilters());
      setPage(0);
    },
    page: safePage,
    pageSize,
    total,
    totalPages,
    setPage: (next) => setPage(Math.max(0, Math.min(next, totalPages - 1))),
    setPageSize: (nextSize) => {
      setPageSize(nextSize);
      setPage(0);
    },
    pageSizeOptions: MENU_PAGE_SIZE_OPTIONS,
    form,
    setForm,
    editingId,
    composerOpen,
    openComposer,
    closeComposer,
    saveMutation,
    deactivateMutation,
    createVariantMutation,
    variantSource,
    variantForm,
    setVariantForm,
    openVariantForm,
    closeVariantForm: () => setVariantSource(null),
    startEdit,
    toggleGroup,
    onImageFile,
    stationName,
    isLoading: (workspace.storeId == null && workspace.isLoading) || itemsQuery.isLoading,
    resetForm: closeComposer,
  };
}

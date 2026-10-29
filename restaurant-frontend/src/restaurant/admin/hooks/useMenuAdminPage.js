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
import {
  formatPortionAmountDisplay,
  parsePortionAmountInput,
} from '../../shared/utils/portionAmountInput';

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
  ikpu: '',
  packageCode: '',
  unitOfMeasure: '',
  unitMeasureCode: '',
  barcode: '',
  markedProduct: false,
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
  const [editingVariantId, setEditingVariantId] = useState(null);

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

  // One admin card per size family (not a separate card per 0.5 / 1 / 1.5 SKU).
  const familyRows = useMemo(() => {
    const map = new Map();
    for (const item of filteredItems) {
      const key = item.variantGroupId || item.id;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(item);
    }
    return [...map.values()].map((variants) => {
      const sorted = [...variants].sort((a, b) => {
        const pa = Number(a.portionAmount) || Number(a.portionGrams) || 0;
        const pb = Number(b.portionAmount) || Number(b.portionGrams) || 0;
        if (pa !== pb) return pa - pb;
        return (Number(a.price) || 0) - (Number(b.price) || 0);
      });
      const prices = sorted.map((v) => Number(v.price) || 0);
      const primary = sorted[0];
      return {
        ...primary,
        _familySizeCount: sorted.length,
        _familyMinPrice: Math.min(...prices),
        _familyVariants: sorted,
      };
    });
  }, [filteredItems]);

  const total = familyRows.length;
  const totalPages = pageSize > 0 ? Math.max(1, Math.ceil(total / pageSize)) : 1;
  const safePage = Math.min(page, Math.max(0, totalPages - 1));
  const rows = useMemo(() => {
    const start = safePage * pageSize;
    return familyRows.slice(start, start + pageSize);
  }, [familyRows, safePage, pageSize]);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['rst-menu-admin', workspace.storeId] });
    qc.invalidateQueries({ queryKey: ['rst-menu-pos', workspace.storeId] });
  };

  const saveMutation = useMutation({
    mutationFn: () => {
      const portionAmount = form.portionAmount === ''
        ? null
        : parsePortionAmountInput(form.portionAmount);
      if (form.portionAmount !== '' && portionAmount == null) {
        throw new Error(t('rst.admin.portionAmountInvalid'));
      }
      const portionUnit = portionAmount == null ? null : (form.portionUnit || 'PORTION');
      if (portionUnit === 'KG' && (!(portionAmount > 0) || portionAmount > 10)) {
        throw new Error(t('rst.admin.portionKgMaxError', {
          defaultValue: 'Для весового блюда укажите вес от 0.001 до 10 кг',
        }));
      }
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
        portionAmount,
        portionUnit,
        portionLabel: form.portionLabel.trim() || null,
        tags: form.tags.trim() || null,
        modifierGroupIds: form.modifierGroupIds,
        ikpu: form.ikpu.trim() || null,
        packageCode: form.packageCode.trim() || null,
        unitOfMeasure: form.unitOfMeasure.trim() || null,
        unitMeasureCode: form.unitMeasureCode.trim() || null,
        barcode: form.barcode.trim() || null,
        markedProduct: Boolean(form.markedProduct),
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

  const sortVariants = (list) => [...list].sort((a, b) => {
    const pa = Number(a.portionAmount) || Number(a.portionGrams) || 0;
    const pb = Number(b.portionAmount) || Number(b.portionGrams) || 0;
    if (pa !== pb) return pa - pb;
    return (Number(a.price) || 0) - (Number(b.price) || 0);
  });

  const variantFamily = useMemo(() => {
    if (!variantSource) return [];
    const groupId = variantSource.variantGroupId;
    if (groupId) {
      return sortVariants(items.filter((row) => row.variantGroupId === groupId));
    }
    return sortVariants(items.filter((row) => row.id === variantSource.id));
  }, [items, variantSource]);

  const fillVariantForm = (item) => ({
    price: String(item?.price ?? ''),
    portionAmount: item?.portionAmount != null
      ? formatPortionAmountDisplay(item.portionAmount)
      : '',
    portionUnit: item?.portionUnit || 'PORTION',
    portionLabel: item?.portionLabel ?? '',
    sku: item?.sku ?? '',
  });

  const resetVariantEditor = () => {
    setEditingVariantId(null);
    setVariantForm({
      ...emptyVariantForm(),
      price: String(variantSource?.price ?? ''),
    });
  };

  const saveVariantMutation = useMutation({
    mutationFn: () => {
      const portionAmount = variantForm.portionAmount === ''
        ? null
        : parsePortionAmountInput(variantForm.portionAmount);
      if (variantForm.portionAmount !== '' && portionAmount == null) {
        throw new Error(t('rst.admin.portionAmountInvalid'));
      }
      const portionUnit = portionAmount == null ? null : (variantForm.portionUnit || 'PORTION');
      const sku = variantForm.sku.trim() || null;
      const portionLabel = variantForm.portionLabel.trim() || null;
      const price = Number(variantForm.price);

      if (editingVariantId) {
        const current = items.find((row) => row.id === editingVariantId) || variantSource;
        return rstMenuApi.update(editingVariantId, {
          name: current.name,
          sku,
          price,
          taxRate: Number(current.taxRate) || 0,
          available: current.available !== false,
          sortOrder: Number(current.sortOrder) || 100,
          itemType: current.itemType || 'DISH',
          stationId: current.stationId || null,
          menuCategoryId: current.menuCategoryId || null,
          imageUrl: current.imageUrl || null,
          description: current.description || null,
          prepMinutes: current.prepMinutes ?? null,
          portionAmount,
          portionUnit,
          portionLabel,
          tags: current.tags || null,
          modifierGroupIds: current.modifierGroupIds ?? [],
        });
      }

      return rstMenuApi.createVariant(variantSource.id, {
        price,
        portionAmount,
        portionUnit,
        portionLabel,
        sku,
      });
    },
    onSuccess: (res) => {
      const saved = res?.data;
      const wasEdit = Boolean(editingVariantId);
      toast.success(
        wasEdit
          ? t('rst.admin.variantUpdated', { defaultValue: 'Размер обновлён' })
          : t('rst.admin.variantCreated'),
      );
      if (saved?.variantGroupId && variantSource) {
        setVariantSource((prev) => (prev
          ? { ...prev, variantGroupId: saved.variantGroupId || prev.variantGroupId }
          : prev));
      }
      if (saved && workspace.storeId != null) {
        qc.setQueryData(['rst-menu-admin', workspace.storeId], (old) => {
          if (!Array.isArray(old)) return old;
          const groupId = saved.variantGroupId;
          const next = old.map((row) => {
            if (row.id === saved.id) return { ...row, ...saved };
            if (groupId && (row.id === variantSource?.id || row.variantGroupId === groupId)) {
              return { ...row, variantGroupId: groupId };
            }
            return row;
          });
          if (!next.some((row) => row.id === saved.id)) next.push(saved);
          return next;
        });
      }
      resetVariantEditor();
      invalidate();
    },
    onError: (err) => toastApiError(err, t('rst.admin.saveFailed')),
  });

  const deleteVariantMutation = useMutation({
    mutationFn: (itemId) => rstMenuApi.deactivate(itemId),
    onSuccess: (_, itemId) => {
      toast.success(t('rst.admin.variantRemoved', { defaultValue: 'Размер скрыт' }));
      if (editingVariantId === itemId) {
        setEditingVariantId(null);
        setVariantForm({
          ...emptyVariantForm(),
          price: String(variantSource?.price ?? ''),
        });
      }
      const remaining = variantFamily.filter((row) => row.id !== itemId);
      if (remaining.length === 0) {
        setVariantSource(null);
        setEditingVariantId(null);
      } else if (variantSource?.id === itemId) {
        setVariantSource(remaining[0]);
      }
      invalidate();
    },
    onError: (err) => toastApiError(err, t('rst.admin.deleteFailed')),
  });

  const openVariantForm = (item, editItem = null) => {
    setVariantSource(item);
    if (editItem) {
      setEditingVariantId(editItem.id);
      setVariantForm(fillVariantForm(editItem));
      return;
    }
    setEditingVariantId(null);
    setVariantForm({ ...emptyVariantForm(), price: String(item.price ?? '') });
  };

  const startEditVariant = (item) => {
    setEditingVariantId(item.id);
    setVariantForm(fillVariantForm(item));
  };

  const closeVariantForm = () => {
    setVariantSource(null);
    setEditingVariantId(null);
    setVariantForm(emptyVariantForm());
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
        ? formatPortionAmountDisplay(item.portionAmount)
        : (item.portionGrams != null && !item.portionUnit
          ? String(Math.round(Number(item.portionGrams)))
          : ''),
      portionUnit: item.portionUnit
        || (item.portionGrams != null && item.portionAmount == null ? 'G' : 'PORTION'),
      portionLabel: item.portionLabel ?? '',
      tags: item.tags ?? '',
      modifierGroupIds: item.modifierGroupIds ?? [],
      ikpu: item.ikpu ?? '',
      packageCode: item.packageCode ?? '',
      unitOfMeasure: item.unitOfMeasure ?? '',
      unitMeasureCode: item.unitMeasureCode ?? '',
      barcode: item.barcode ?? '',
      markedProduct: Boolean(item.markedProduct),
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
    saveVariantMutation,
    deleteVariantMutation,
    variantSource,
    variantFamily,
    variantForm,
    setVariantForm,
    editingVariantId,
    openVariantForm,
    closeVariantForm,
    startEditVariant,
    resetVariantEditor,
    startEdit,
    toggleGroup,
    onImageFile,
    stationName,
    isLoading: (workspace.storeId == null && workspace.isLoading) || itemsQuery.isLoading,
    isError: itemsQuery.isError,
    refetch: () => itemsQuery.refetch(),
    resetForm: closeComposer,
  };
}

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { rstKitchenApi } from '../../api/kitchen.api';
import { rstMenuApi } from '../../api/menu.api';
import { useRestaurantWorkspaceStore } from '../../shared/hooks/useRestaurantWorkspaceStore';
import { toastApiError } from '../../../utils/apiError';

const emptyForm = () => ({ name: '', sortOrder: 100, autoPrint: false, printStationId: '' });

export const MENU_CAT_PAGE_SIZE_OPTIONS = [10, 14, 20];
const DEFAULT_PAGE_SIZE = 14;

export function useMenuCategoriesAdminPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const workspace = useRestaurantWorkspaceStore();
  const [form, setForm] = useState(emptyForm());
  const [editingId, setEditingId] = useState(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const stationsQuery = useQuery({
    queryKey: ['rst-kitchen-stations', workspace.storeId],
    queryFn: () => rstKitchenApi.listStations(workspace.storeId, true).then((r) => r.data ?? []),
    enabled: workspace.storeId != null,
    staleTime: 60_000,
  });

  const categoriesQuery = useQuery({
    queryKey: ['rst-menu-categories-admin', workspace.storeId],
    queryFn: () => rstMenuApi.listCategories(workspace.storeId, false).then((r) => r.data),
    enabled: workspace.storeId != null,
  });

  const categories = useMemo(
    () => (categoriesQuery.data ?? []).filter((row) => row.active),
    [categoriesQuery.data],
  );

  const total = categories.length;
  const totalPages = pageSize > 0 ? Math.max(1, Math.ceil(total / pageSize)) : 1;
  const safePage = Math.min(page, Math.max(0, totalPages - 1));
  const rows = useMemo(() => {
    const start = safePage * pageSize;
    return categories.slice(start, start + pageSize);
  }, [categories, safePage, pageSize]);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['rst-menu-categories-admin', workspace.storeId] });
    qc.invalidateQueries({ queryKey: ['rst-menu-categories', workspace.storeId] });
    qc.invalidateQueries({ queryKey: ['rst-menu-admin', workspace.storeId] });
    qc.invalidateQueries({ queryKey: ['rst-menu-pos', workspace.storeId] });
  };

  const saveMutation = useMutation({
    mutationFn: () => {
      const body = {
        name: form.name.trim(),
        sortOrder: Number(form.sortOrder) || 100,
        autoPrint: Boolean(form.autoPrint),
        printStationId: form.autoPrint && form.printStationId ? form.printStationId : null,
      };
      if (editingId) return rstMenuApi.updateCategory(editingId, body);
      return rstMenuApi.createCategory(workspace.storeId, body);
    },
    onSuccess: () => {
      toast.success(t('rst.admin.menuCategorySaved'));
      setForm(emptyForm());
      setEditingId(null);
      setPage(0);
      invalidate();
    },
    onError: (err) => toastApiError(err, t('rst.admin.saveFailed')),
  });

  const deactivateMutation = useMutation({
    mutationFn: (categoryId) => rstMenuApi.deactivateCategory(categoryId),
    onSuccess: () => {
      toast.success(t('rst.admin.menuCategoryDeactivated'));
      invalidate();
    },
    onError: (err) => toastApiError(err, t('rst.admin.deleteFailed')),
  });

  const startEdit = (row) => {
    setEditingId(row.id);
    setForm({
      name: row.name,
      sortOrder: row.sortOrder,
      autoPrint: Boolean(row.autoPrint),
      printStationId: row.printStationId || '',
    });
  };

  return {
    t,
    workspace,
    rows,
    page: safePage,
    pageSize,
    total,
    totalPages,
    setPage: (next) => setPage(Math.max(0, Math.min(next, totalPages - 1))),
    setPageSize: (nextSize) => {
      setPageSize(nextSize);
      setPage(0);
    },
    pageSizeOptions: MENU_CAT_PAGE_SIZE_OPTIONS,
    form,
    setForm,
    stations: stationsQuery.data ?? [],
    editingId,
    isLoading: categoriesQuery.isLoading,
    saveMutation,
    deactivateMutation,
    startEdit,
    resetForm: () => {
      setEditingId(null);
      setForm(emptyForm());
    },
  };
}

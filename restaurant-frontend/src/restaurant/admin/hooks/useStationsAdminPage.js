import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { rstKitchenApi } from '../../api/kitchen.api';
import { useRestaurantWorkspaceStore } from '../../shared/hooks/useRestaurantWorkspaceStore';

const emptyForm = () => ({ code: '', name: '', sortOrder: 100 });

export const STATIONS_PAGE_SIZE_OPTIONS = [10, 14, 20];
const DEFAULT_PAGE_SIZE = 14;

export function useStationsAdminPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const workspace = useRestaurantWorkspaceStore();
  const [form, setForm] = useState(emptyForm());
  const [editingId, setEditingId] = useState(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const stationsQuery = useQuery({
    queryKey: ['rst-stations-admin', workspace.storeId],
    queryFn: () => rstKitchenApi.listStations(workspace.storeId, false).then((r) => r.data),
    enabled: workspace.storeId != null,
  });

  const stations = useMemo(
    () => (stationsQuery.data ?? []).filter((station) => station.active),
    [stationsQuery.data],
  );

  const total = stations.length;
  const totalPages = pageSize > 0 ? Math.max(1, Math.ceil(total / pageSize)) : 1;
  const safePage = Math.min(page, Math.max(0, totalPages - 1));
  const rows = useMemo(() => {
    const start = safePage * pageSize;
    return stations.slice(start, start + pageSize);
  }, [stations, safePage, pageSize]);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['rst-stations-admin', workspace.storeId] });
    qc.invalidateQueries({ queryKey: ['rst-stations', workspace.storeId] });
  };

  const saveMutation = useMutation({
    mutationFn: () => {
      const body = {
        code: form.code,
        name: form.name,
        sortOrder: Number(form.sortOrder) || 100,
      };
      if (editingId) return rstKitchenApi.updateStation(editingId, body);
      return rstKitchenApi.createStation(workspace.storeId, body);
    },
    onSuccess: () => {
      toast.success(t('rst.admin.stationSaved'));
      setForm(emptyForm());
      setEditingId(null);
      setPage(0);
      invalidate();
    },
    onError: (err) => toast.error(err?.response?.data?.message ?? t('rst.admin.saveFailed')),
  });

  const deactivateMutation = useMutation({
    mutationFn: (stationId) => rstKitchenApi.deactivateStation(stationId),
    onSuccess: () => {
      toast.success(t('rst.admin.stationDeactivated'));
      invalidate();
    },
    onError: (err) => toast.error(err?.response?.data?.message ?? t('rst.admin.deleteFailed')),
  });

  const startEdit = (station) => {
    setEditingId(station.id);
    setForm({
      code: station.code,
      name: station.name,
      sortOrder: station.sortOrder,
    });
  };

  return {
    t,
    workspace,
    stations,
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
    pageSizeOptions: STATIONS_PAGE_SIZE_OPTIONS,
    form,
    setForm,
    editingId,
    saveMutation,
    deactivateMutation,
    startEdit,
    resetForm: () => {
      setEditingId(null);
      setForm(emptyForm());
    },
    isLoading: workspace.isLoading || stationsQuery.isLoading,
  };
}

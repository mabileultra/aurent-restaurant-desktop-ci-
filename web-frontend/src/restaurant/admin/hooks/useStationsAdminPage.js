import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { rstKitchenApi } from '../../api/kitchen.api';
import { useRestaurantWorkspaceStore } from '../../shared/hooks/useRestaurantWorkspaceStore';

const emptyForm = () => ({ code: '', name: '', sortOrder: 100 });

export function useStationsAdminPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const workspace = useRestaurantWorkspaceStore();
  const [form, setForm] = useState(emptyForm());
  const [editingId, setEditingId] = useState(null);

  const stationsQuery = useQuery({
    queryKey: ['rst-stations-admin', workspace.storeId],
    queryFn: () => rstKitchenApi.listStations(workspace.storeId, false).then((r) => r.data),
    enabled: workspace.storeId != null,
  });

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
      qc.invalidateQueries({ queryKey: ['rst-stations-admin', workspace.storeId] });
      qc.invalidateQueries({ queryKey: ['rst-stations', workspace.storeId] });
    },
    onError: (err) => toast.error(err?.response?.data?.message ?? t('rst.admin.saveFailed')),
  });

  const deactivateMutation = useMutation({
    mutationFn: (stationId) => rstKitchenApi.deactivateStation(stationId),
    onSuccess: () => {
      toast.success(t('rst.admin.stationDeactivated'));
      qc.invalidateQueries({ queryKey: ['rst-stations-admin', workspace.storeId] });
      qc.invalidateQueries({ queryKey: ['rst-stations', workspace.storeId] });
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
    stations: stationsQuery.data ?? [],
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
  };
}

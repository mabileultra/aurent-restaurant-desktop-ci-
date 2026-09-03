import { useCallback, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { rstFloorApi } from '../../api/floor.api';
import { useRestaurantWorkspaceStore } from '../../shared/hooks/useRestaurantWorkspaceStore';
import { gridSlot, TABLE_DEFAULT_SIZE } from '../../pos/utils/resolveFloorPositions';

const emptyHallForm = () => ({ name: '', sortOrder: 100 });

const nextTableForm = (existingTables = []) => {
  const slot = gridSlot(existingTables.length);
  return {
    code: '',
    label: '',
    seatCount: 4,
    status: 'FREE',
    width: TABLE_DEFAULT_SIZE,
    height: TABLE_DEFAULT_SIZE,
    ...slot,
  };
};

export function useHallsAdminPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const workspace = useRestaurantWorkspaceStore();
  const [selectedHallId, setSelectedHallId] = useState(null);
  const [hallModal, setHallModal] = useState(null);
  const [tableModal, setTableModal] = useState(null);

  const floorQuery = useQuery({
    queryKey: ['rst-floor', workspace.storeId],
    queryFn: () => rstFloorApi.getFloorSnapshot(workspace.storeId).then((r) => r.data),
    enabled: workspace.storeId != null,
  });

  const halls = floorQuery.data?.halls ?? [];
  const selectedHall = halls.find((hall) => hall.id === selectedHallId) ?? halls[0] ?? null;

  const invalidate = useCallback(() => {
    qc.invalidateQueries({ queryKey: ['rst-floor', workspace.storeId] });
  }, [qc, workspace.storeId]);

  const saveHallMutation = useMutation({
    mutationFn: (payload) => {
      const body = { name: payload.name, sortOrder: Number(payload.sortOrder) };
      if (payload.id) return rstFloorApi.updateHall(payload.id, body);
      return rstFloorApi.createHall(workspace.storeId, body);
    },
    onSuccess: () => {
      toast.success(t('rst.admin.hallSaved'));
      setHallModal(null);
      invalidate();
    },
    onError: (err) => toast.error(err?.response?.data?.message ?? t('rst.admin.saveFailed')),
  });

  const saveTableMutation = useMutation({
    mutationFn: (payload) => {
      const body = {
        code: payload.code,
        label: payload.label || null,
        seatCount: Number(payload.seatCount),
        posX: Number(payload.posX),
        posY: Number(payload.posY),
        width: Number(payload.width),
        height: Number(payload.height),
        status: payload.status,
      };
      if (payload.id) return rstFloorApi.updateTable(payload.id, body);
      return rstFloorApi.createTable(selectedHall.id, body);
    },
    onSuccess: () => {
      toast.success(t('rst.admin.tableSaved'));
      setTableModal(null);
      invalidate();
    },
    onError: (err) => toast.error(err?.response?.data?.message ?? t('rst.admin.saveFailed')),
  });

  const deactivateHallMutation = useMutation({
    mutationFn: (hallId) => rstFloorApi.deactivateHall(hallId),
    onSuccess: () => {
      toast.success(t('rst.admin.hallDeactivated'));
      invalidate();
    },
    onError: (err) => toast.error(err?.response?.data?.message ?? t('rst.admin.deleteFailed')),
  });

  const deactivateTableMutation = useMutation({
    mutationFn: (tableId) => rstFloorApi.deactivateTable(tableId),
    onSuccess: () => {
      toast.success(t('rst.admin.tableDeactivated'));
      invalidate();
    },
    onError: (err) => toast.error(err?.response?.data?.message ?? t('rst.admin.deleteFailed')),
  });

  const arrangeMutation = useMutation({
    mutationFn: () => {
      const tables = selectedHall?.tables ?? [];
      return rstFloorApi.updateLayout(selectedHall.id, {
        tables: tables.map((table, index) => ({
          id: table.id,
          width: table.width || TABLE_DEFAULT_SIZE,
          height: table.height || TABLE_DEFAULT_SIZE,
          ...gridSlot(index),
        })),
      });
    },
    onSuccess: () => {
      toast.success(t('rst.admin.tablesArranged'));
      invalidate();
    },
    onError: (err) => toast.error(err?.response?.data?.message ?? t('rst.admin.saveFailed')),
  });

  return {
    t,
    workspace,
    halls,
    selectedHall,
    setSelectedHallId,
    hallModal,
    setHallModal,
    tableModal,
    setTableModal,
    emptyHallForm,
    nextTableForm,
    saveHallMutation,
    saveTableMutation,
    deactivateHallMutation,
    deactivateTableMutation,
    arrangeMutation,
    isLoading: workspace.isLoading || floorQuery.isLoading,
  };
}

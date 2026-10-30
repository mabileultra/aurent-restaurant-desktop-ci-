import { useCallback, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { rstFloorApi } from '../../api/floor.api';
import { useRestaurantWorkspaceStore } from '../../shared/hooks/useRestaurantWorkspaceStore';
import {
  findFreeGridSlot,
  gridSlot,
  TABLE_DEFAULT_SIZE,
} from '../../pos/utils/resolveFloorPositions';
import { toastApiError } from '../../../utils/apiError';

const emptyHallForm = () => ({ name: '', sortOrder: 100, servicePercent: 0 });

const nextTableForm = (existingTables = []) => {
  const slot = findFreeGridSlot(existingTables, TABLE_DEFAULT_SIZE);
  return {
    code: '',
    label: '',
    seatCount: 4,
    servicePercent: '',
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
      const body = {
        name: payload.name,
        sortOrder: Number(payload.sortOrder),
        servicePercent: Number(payload.servicePercent) || 0,
      };
      if (payload.id) return rstFloorApi.updateHall(payload.id, body);
      return rstFloorApi.createHall(workspace.storeId, body);
    },
    onSuccess: () => {
      toast.success(t('rst.admin.hallSaved'));
      setHallModal(null);
      invalidate();
    },
    onError: (err) => toastApiError(err, t('rst.admin.saveFailed')),
  });

  const saveTableMutation = useMutation({
    mutationFn: (payload) => {
      // Never persist canvas-scaled geometry from FloorCanvas — keep server layout on edit.
      const existing = payload.id
        ? selectedHall?.tables?.find((table) => table.id === payload.id)
        : null;
      const body = {
        code: payload.code,
        label: payload.label || null,
        seatCount: Number(payload.seatCount),
        servicePercent: String(payload.servicePercent ?? '').trim() === ''
          ? null
          : Number(payload.servicePercent),
        posX: existing ? Number(existing.posX) : Number(payload.posX),
        posY: existing ? Number(existing.posY) : Number(payload.posY),
        width: existing ? Number(existing.width) : Number(payload.width),
        height: existing ? Number(existing.height) : Number(payload.height),
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
    onError: (err) => toastApiError(err, t('rst.admin.saveFailed')),
  });

  const deactivateHallMutation = useMutation({
    mutationFn: (hallId) => rstFloorApi.deactivateHall(hallId),
    onSuccess: () => {
      toast.success(t('rst.admin.hallDeactivated'));
      invalidate();
    },
    onError: (err) => toastApiError(err, t('rst.admin.deleteFailed')),
  });

  const deactivateTableMutation = useMutation({
    mutationFn: (tableId) => rstFloorApi.deactivateTable(tableId),
    onSuccess: () => {
      toast.success(t('rst.admin.tableDeactivated'));
      invalidate();
    },
    onError: (err) => toastApiError(err, t('rst.admin.deleteFailed')),
  });

  const arrangeMutation = useMutation({
    mutationFn: () => {
      const tables = [...(selectedHall?.tables ?? [])].sort((a, b) =>
        String(a.code ?? '').localeCompare(String(b.code ?? ''), undefined, { numeric: true }),
      );
      return rstFloorApi.updateLayout(selectedHall.id, {
        tables: tables.map((table, index) => ({
          id: table.id,
          width: TABLE_DEFAULT_SIZE,
          height: TABLE_DEFAULT_SIZE,
          ...gridSlot(index),
        })),
      });
    },
    onSuccess: () => {
      toast.success(t('rst.admin.tablesArranged'));
      invalidate();
    },
    onError: (err) => toastApiError(err, t('rst.admin.saveFailed')),
  });

  const floorQueryKey = ['rst-floor', workspace.storeId];

  const moveTableMutation = useMutation({
    // Serialize layout writes so a later drag cannot overwrite an earlier one
    // with a stale selectedHall snapshot from before invalidate finished.
    scope: { id: `rst-hall-table-layout-${workspace.storeId ?? 'none'}` },
    mutationFn: (moved) => {
      const floor = qc.getQueryData(floorQueryKey);
      const hall = floor?.halls?.find((row) =>
        row.tables?.some((table) => table.id === moved.id),
      );
      if (!hall?.id) {
        return Promise.reject(new Error('Hall not found for moved table'));
      }
      return rstFloorApi.updateLayout(hall.id, {
        tables: (hall.tables ?? []).map((table) => ({
          id: table.id,
          posX: Number(table.posX),
          posY: Number(table.posY),
          width: TABLE_DEFAULT_SIZE,
          height: TABLE_DEFAULT_SIZE,
        })),
      });
    },
    onMutate: async (moved) => {
      await qc.cancelQueries({ queryKey: floorQueryKey });
      const previous = qc.getQueryData(floorQueryKey);
      qc.setQueryData(floorQueryKey, (old) => {
        if (!old?.halls) return old;
        return {
          ...old,
          halls: old.halls.map((hall) => {
            if (!hall.tables?.some((table) => table.id === moved.id)) return hall;
            return {
              ...hall,
              tables: hall.tables.map((table) =>
                table.id === moved.id
                  ? {
                      ...table,
                      posX: Number(moved.posX),
                      posY: Number(moved.posY),
                      width: TABLE_DEFAULT_SIZE,
                      height: TABLE_DEFAULT_SIZE,
                    }
                  : table,
              ),
            };
          }),
        };
      });
      return { previous };
    },
    onError: (err, _moved, ctx) => {
      if (ctx?.previous) qc.setQueryData(floorQueryKey, ctx.previous);
      toastApiError(err, t('rst.admin.saveFailed'));
    },
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
    moveTableMutation,
    isLoading: (workspace.storeId == null && workspace.isLoading) || floorQuery.isLoading,
    isError: floorQuery.isError,
    refetch: () => floorQuery.refetch(),
  };
}

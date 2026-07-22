import { useCallback, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { restaurantApi } from '../../../api';
import { useRestaurantStores } from '../../../hooks/useRestaurantStores';

const emptyHallForm = () => ({ name: '', sortOrder: 100 });

const TABLE_DEFAULT_SIZE = 88;
const TABLE_GRID_GAP = 24;
const TABLE_GRID_COLUMNS = 4;

const gridPosition = (index) => {
  const col = index % TABLE_GRID_COLUMNS;
  const row = Math.floor(index / TABLE_GRID_COLUMNS);
  return {
    posX: 40 + col * (TABLE_DEFAULT_SIZE + TABLE_GRID_GAP),
    posY: 40 + row * (TABLE_DEFAULT_SIZE + TABLE_GRID_GAP),
  };
};

const nextTableForm = (existingTables = []) => ({
  code: '',
  label: '',
  seatCount: 4,
  ...gridPosition(existingTables.length),
  width: TABLE_DEFAULT_SIZE,
  height: TABLE_DEFAULT_SIZE,
});

// Столы, созданные без явных координат, оказываются наложены друг на друга (одинаковые posX/posY).
// Раскладывает их по сетке через тот же бэкенд-эндпоинт, что и ручное перетаскивание — без прямого доступа к БД.
const buildTableLayout = (tables = []) => {
  const movable = tables.filter((table) => table.status !== 'OCCUPIED');
  return movable.map((table, index) => ({
    id: table.id,
    width: table.width || TABLE_DEFAULT_SIZE,
    height: table.height || TABLE_DEFAULT_SIZE,
    ...gridPosition(index),
  }));
};

export function useRestaurantHallPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [storeId, setStoreId] = useState('');
  const [selectedHallId, setSelectedHallId] = useState(null);
  const [hallModal, setHallModal] = useState(null);
  const [tableModal, setTableModal] = useState(null);

  const { restaurantStores } = useRestaurantStores();

  const effectiveStoreId = storeId || (restaurantStores.length === 1 ? String(restaurantStores[0].id) : '');

  const floorQuery = useQuery({
    queryKey: ['restaurant-hall', effectiveStoreId],
    queryFn: () => restaurantApi.getFloorSnapshot(Number(effectiveStoreId)).then((r) => r.data),
    enabled: !!effectiveStoreId,
  });

  const halls = floorQuery.data?.halls ?? [];
  const selectedHall = halls.find((h) => h.id === selectedHallId) ?? halls[0] ?? null;

  const invalidate = useCallback(() => {
    qc.invalidateQueries({ queryKey: ['restaurant-hall', effectiveStoreId] });
    qc.invalidateQueries({ queryKey: ['restaurant-halls', effectiveStoreId] });
  }, [qc, effectiveStoreId]);

  const saveHallMutation = useMutation({
    mutationFn: (payload) => {
      if (payload.id) {
        return restaurantApi.updateHall(payload.id, { name: payload.name, sortOrder: payload.sortOrder });
      }
      return restaurantApi.createHall(Number(effectiveStoreId), { name: payload.name, sortOrder: payload.sortOrder });
    },
    onSuccess: () => {
      toast.success(t('restaurantHall.hallSaved'));
      setHallModal(null);
      invalidate();
    },
    onError: (err) => toast.error(err?.response?.data?.message ?? t('restaurantHall.saveFailed')),
  });

  const saveTableMutation = useMutation({
    mutationFn: (payload) => {
      const body = {
        code: payload.code,
        label: payload.label || undefined,
        seatCount: Number(payload.seatCount),
        posX: Number(payload.posX),
        posY: Number(payload.posY),
        width: Number(payload.width),
        height: Number(payload.height),
      };
      if (payload.id) {
        return restaurantApi.updateTable(payload.id, body);
      }
      return restaurantApi.createTable(selectedHall.id, body);
    },
    onSuccess: () => {
      toast.success(t('restaurantHall.tableSaved'));
      setTableModal(null);
      invalidate();
    },
    onError: (err) => toast.error(err?.response?.data?.message ?? t('restaurantHall.saveFailed')),
  });

  const arrangeTablesMutation = useMutation({
    mutationFn: () => restaurantApi.updateLayout(selectedHall.id, { tables: buildTableLayout(selectedHall.tables) }),
    onSuccess: () => {
      toast.success(t('restaurantHall.tablesArranged'));
      invalidate();
    },
    onError: (err) => toast.error(err?.response?.data?.message ?? t('restaurantHall.saveFailed')),
  });

  const deactivateHallMutation = useMutation({
    mutationFn: (hallId) => restaurantApi.deactivateHall(hallId),
    onSuccess: () => {
      toast.success(t('restaurantHall.hallDeactivated'));
      setSelectedHallId(null);
      invalidate();
    },
    onError: (err) => toast.error(err?.response?.data?.message ?? t('restaurantHall.deleteFailed')),
  });

  const deactivateTableMutation = useMutation({
    mutationFn: (tableId) => restaurantApi.deactivateTable(tableId),
    onSuccess: () => {
      toast.success(t('restaurantHall.tableDeactivated'));
      invalidate();
    },
    onError: (err) => toast.error(err?.response?.data?.message ?? t('restaurantHall.deleteFailed')),
  });

  const openCreateHall = () => setHallModal({ mode: 'create', form: emptyHallForm() });
  const openEditHall = (hall) => setHallModal({ mode: 'edit', id: hall.id, form: { name: hall.name, sortOrder: hall.sortOrder } });
  const openCreateTable = () => {
    if (!selectedHall) return;
    setTableModal({ mode: 'create', form: nextTableForm(selectedHall.tables ?? []) });
  };
  const arrangeTables = () => {
    if (!selectedHall || (selectedHall.tables ?? []).length === 0) return;
    arrangeTablesMutation.mutate();
  };
  const openEditTable = (table) => setTableModal({
    mode: 'edit',
    id: table.id,
    form: {
      code: table.code,
      label: table.label ?? '',
      seatCount: table.seatCount,
      posX: table.posX,
      posY: table.posY,
      width: table.width,
      height: table.height,
    },
  });

  return {
    t,
    restaurantStores,
    storeId: effectiveStoreId,
    setStoreId,
    floorQuery,
    halls,
    selectedHall,
    selectedHallId: selectedHall?.id ?? null,
    setSelectedHallId,
    hallModal,
    setHallModal,
    tableModal,
    setTableModal,
    openCreateHall,
    openEditHall,
    openCreateTable,
    openEditTable,
    arrangeTables,
    saveHallMutation,
    saveTableMutation,
    arrangeTablesMutation,
    deactivateHallMutation,
    deactivateTableMutation,
  };
}

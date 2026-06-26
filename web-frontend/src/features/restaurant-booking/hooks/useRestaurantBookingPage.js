import { useCallback, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { restaurantApi } from '../../../api';
import { useRestaurantStores } from '../../../hooks/useRestaurantStores';

const emptyForm = () => ({
  tableId: '',
  clientName: '',
  clientPhone: '',
  guestCount: 2,
  reservedAt: '',
  durationMinutes: 120,
  notes: '',
});

function toLocalInputValue(date) {
  const d = date instanceof Date ? date : new Date(date);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function useRestaurantBookingPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { restaurantStores } = useRestaurantStores();
  const [storeId, setStoreId] = useState('');
  const [modal, setModal] = useState(null);

  const effectiveStoreId = storeId || (restaurantStores.length === 1 ? String(restaurantStores[0].id) : '');

  const tablesQuery = useQuery({
    queryKey: ['restaurant-booking-tables', effectiveStoreId],
    queryFn: () => restaurantApi.listBookingTables(Number(effectiveStoreId)).then((r) => r.data),
    enabled: !!effectiveStoreId,
  });

  const reservationsQuery = useQuery({
    queryKey: ['restaurant-booking', effectiveStoreId],
    queryFn: () => restaurantApi.listReservations(Number(effectiveStoreId), { activeOnly: true }).then((r) => r.data),
    enabled: !!effectiveStoreId,
    retry: 1,
  });

  const tableOptions = useMemo(
    () => (tablesQuery.data ?? []).map((table) => ({
      id: table.id,
      label: `${table.hallName} — ${table.code}${table.label ? ` (${table.label})` : ''}`,
      seatCount: table.seatCount,
      status: table.status,
    })),
    [tablesQuery.data]
  );

  const invalidate = useCallback(() => {
    qc.invalidateQueries({ queryKey: ['restaurant-booking', effectiveStoreId] });
    qc.invalidateQueries({ queryKey: ['restaurant-booking-tables', effectiveStoreId] });
    qc.invalidateQueries({ queryKey: ['restaurant-hall', effectiveStoreId] });
  }, [qc, effectiveStoreId]);

  const saveMutation = useMutation({
    mutationFn: (payload) => {
      const body = {
        tableId: Number(payload.tableId),
        clientName: payload.clientName,
        clientPhone: payload.clientPhone || undefined,
        guestCount: Number(payload.guestCount),
        reservedAt: new Date(payload.reservedAt).toISOString(),
        durationMinutes: Number(payload.durationMinutes) || 120,
        notes: payload.notes || undefined,
      };
      if (payload.id) {
        return restaurantApi.updateReservation(payload.id, body);
      }
      return restaurantApi.createReservation(Number(effectiveStoreId), body);
    },
    onSuccess: () => {
      toast.success(t('restaurantBooking.saved'));
      setModal(null);
      invalidate();
    },
    onError: (err) => toast.error(err?.response?.data?.message ?? t('restaurantBooking.saveFailed')),
  });

  const confirmMutation = useMutation({
    mutationFn: (id) => restaurantApi.confirmReservation(id),
    onSuccess: () => {
      toast.success(t('restaurantBooking.confirmed'));
      invalidate();
    },
    onError: (err) => toast.error(err?.response?.data?.message ?? t('restaurantBooking.actionFailed')),
  });

  const cancelMutation = useMutation({
    mutationFn: (id) => restaurantApi.cancelReservation(id),
    onSuccess: () => {
      toast.success(t('restaurantBooking.cancelled'));
      invalidate();
    },
    onError: (err) => toast.error(err?.response?.data?.message ?? t('restaurantBooking.actionFailed')),
  });

  const noShowMutation = useMutation({
    mutationFn: (id) => restaurantApi.noShowReservation(id),
    onSuccess: () => {
      toast.success(t('restaurantBooking.noShowMarked'));
      invalidate();
    },
    onError: (err) => toast.error(err?.response?.data?.message ?? t('restaurantBooking.actionFailed')),
  });

  const openCreate = () => {
    tablesQuery.refetch();
    setModal({
      mode: 'create',
      form: { ...emptyForm(), reservedAt: toLocalInputValue(new Date(Date.now() + 3_600_000)) },
    });
  };

  const openEdit = (row) => {
    tablesQuery.refetch();
    setModal({
      mode: 'edit',
      id: row.id,
      form: {
        tableId: String(row.tableId),
        clientName: row.clientName,
        clientPhone: row.clientPhone ?? '',
        guestCount: row.guestCount,
        reservedAt: toLocalInputValue(row.reservedAt),
        durationMinutes: row.durationMinutes,
        notes: row.notes ?? '',
      },
    });
  };

  return {
    t,
    restaurantStores,
    storeId: effectiveStoreId,
    setStoreId,
    tablesQuery,
    reservationsQuery,
    reservations: reservationsQuery.data ?? [],
    tableOptions,
    modal,
    setModal,
    openCreate,
    openEdit,
    saveMutation,
    confirmMutation,
    cancelMutation,
    noShowMutation,
  };
}

import { useCallback, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { rstBookingApi } from '../../api/booking.api';
import { useRestaurantWorkspaceStore } from '../../shared/hooks/useRestaurantWorkspaceStore';

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

export function useBookingAdminPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const workspace = useRestaurantWorkspaceStore();
  const [modal, setModal] = useState(null);

  const tablesQuery = useQuery({
    queryKey: ['rst-booking-tables', workspace.storeId],
    queryFn: () => rstBookingApi.listTables(workspace.storeId).then((r) => r.data),
    enabled: workspace.storeId != null,
  });

  const reservationsQuery = useQuery({
    queryKey: ['rst-booking', workspace.storeId],
    queryFn: () => rstBookingApi.list(workspace.storeId, { activeOnly: true }).then((r) => r.data),
    enabled: workspace.storeId != null,
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
    qc.invalidateQueries({ queryKey: ['rst-booking', workspace.storeId] });
    qc.invalidateQueries({ queryKey: ['rst-booking-tables', workspace.storeId] });
    qc.invalidateQueries({ queryKey: ['rst-floor', workspace.storeId] });
  }, [qc, workspace.storeId]);

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
        return rstBookingApi.update(payload.id, body);
      }
      return rstBookingApi.create(workspace.storeId, body);
    },
    onSuccess: () => {
      toast.success(t('rst.booking.saved'));
      setModal(null);
      invalidate();
    },
    onError: (err) => toast.error(err?.response?.data?.message ?? t('rst.booking.saveFailed')),
  });

  const confirmMutation = useMutation({
    mutationFn: (id) => rstBookingApi.confirm(id),
    onSuccess: () => { toast.success(t('rst.booking.confirmed')); invalidate(); },
    onError: (err) => toast.error(err?.response?.data?.message ?? t('rst.booking.actionFailed')),
  });
  const cancelMutation = useMutation({
    mutationFn: (id) => rstBookingApi.cancel(id),
    onSuccess: () => { toast.success(t('rst.booking.cancelled')); invalidate(); },
    onError: (err) => toast.error(err?.response?.data?.message ?? t('rst.booking.actionFailed')),
  });
  const noShowMutation = useMutation({
    mutationFn: (id) => rstBookingApi.noShow(id),
    onSuccess: () => { toast.success(t('rst.booking.noShowMarked')); invalidate(); },
    onError: (err) => toast.error(err?.response?.data?.message ?? t('rst.booking.actionFailed')),
  });
  const seatMutation = useMutation({
    mutationFn: (id) => rstBookingApi.seat(id),
    onSuccess: () => { toast.success(t('rst.booking.seated')); invalidate(); },
    onError: (err) => toast.error(err?.response?.data?.message ?? t('rst.booking.actionFailed')),
  });

  return {
    t,
    workspace,
    tablesQuery,
    reservationsQuery,
    reservations: reservationsQuery.data ?? [],
    tableOptions,
    modal,
    setModal,
    openCreate: () => {
      tablesQuery.refetch();
      setModal({
        mode: 'create',
        form: { ...emptyForm(), reservedAt: toLocalInputValue(new Date(Date.now() + 3_600_000)) },
      });
    },
    openEdit: (row) => {
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
    },
    saveMutation,
    confirmMutation,
    cancelMutation,
    noShowMutation,
    seatMutation,
  };
}

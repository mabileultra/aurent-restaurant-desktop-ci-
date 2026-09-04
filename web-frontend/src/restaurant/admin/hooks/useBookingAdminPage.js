import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { rstBookingApi } from '../../api/booking.api';
import { useRestaurantWorkspaceStore } from '../../shared/hooks/useRestaurantWorkspaceStore';

export const BOOKING_PAGE_SIZE_OPTIONS = [10, 14, 20];
const DEFAULT_PAGE_SIZE = 14;

const emptyForm = () => ({
  tableId: '',
  clientName: '',
  clientPhone: '',
  guestCount: 2,
  reservedAt: '',
  durationMinutes: 120,
  notes: '',
});

const emptyFilters = () => ({
  search: '',
  status: 'all',
  fromDate: '',
  toDate: '',
});

function toLocalInputValue(date) {
  const d = date instanceof Date ? date : new Date(date);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toDayStart(value) {
  if (!value) return null;
  const d = new Date(`${value}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function toDayEnd(value) {
  if (!value) return null;
  const d = new Date(`${value}T23:59:59.999`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function useBookingAdminPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const workspace = useRestaurantWorkspaceStore();
  const [modal, setModal] = useState(null);
  const [filters, setFilters] = useState(emptyFilters);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const tablesQuery = useQuery({
    queryKey: ['rst-booking-tables', workspace.storeId],
    queryFn: () => rstBookingApi.listTables(workspace.storeId).then((r) => r.data),
    enabled: workspace.storeId != null,
  });

  const reservationsQuery = useQuery({
    queryKey: ['rst-booking', workspace.storeId],
    queryFn: () => rstBookingApi.list(workspace.storeId, { activeOnly: false }).then((r) => r.data),
    enabled: workspace.storeId != null,
  });

  const tableOptions = useMemo(
    () => (tablesQuery.data ?? []).map((table) => ({
      id: table.id,
      label: `${table.hallName} — ${table.code}${table.label ? ` (${table.label})` : ''}`,
      seatCount: table.seatCount,
      status: table.status,
    })),
    [tablesQuery.data],
  );

  const reservations = useMemo(() => {
    const list = Array.isArray(reservationsQuery.data) ? [...reservationsQuery.data] : [];
    list.sort((a, b) => {
      const ta = a.reservedAt ? new Date(a.reservedAt).getTime() : 0;
      const tb = b.reservedAt ? new Date(b.reservedAt).getTime() : 0;
      return tb - ta;
    });
    return list;
  }, [reservationsQuery.data]);

  const filtered = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    const from = toDayStart(filters.fromDate);
    const to = toDayEnd(filters.toDate);
    return reservations.filter((row) => {
      if (filters.status !== 'all' && row.status !== filters.status) return false;
      if (from || to) {
        const at = row.reservedAt ? new Date(row.reservedAt) : null;
        if (!at) return false;
        if (from && at < from) return false;
        if (to && at > to) return false;
      }
      if (!q) return true;
      const hay = `${row.clientName ?? ''} ${row.clientPhone ?? ''} ${row.tableCode ?? ''} ${row.hallName ?? ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [reservations, filters]);

  const total = filtered.length;
  const totalPages = pageSize > 0 ? Math.max(1, Math.ceil(total / pageSize)) : 1;
  const safePage = Math.min(page, Math.max(0, totalPages - 1));
  const rows = useMemo(() => {
    const start = safePage * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, safePage, pageSize]);

  const stats = useMemo(() => ({
    pending: reservations.filter((r) => r.status === 'PENDING').length,
    confirmed: reservations.filter((r) => r.status === 'CONFIRMED').length,
    seated: reservations.filter((r) => r.status === 'SEATED').length,
    cancelled: reservations.filter((r) => r.status === 'CANCELLED' || r.status === 'NO_SHOW').length,
  }), [reservations]);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['rst-booking', workspace.storeId] });
    qc.invalidateQueries({ queryKey: ['rst-booking-tables', workspace.storeId] });
    qc.invalidateQueries({ queryKey: ['rst-floor', workspace.storeId] });
  };

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
      if (payload.id) return rstBookingApi.update(payload.id, body);
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
    reservations,
    rows,
    stats,
    tableOptions,
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
    pageSizeOptions: BOOKING_PAGE_SIZE_OPTIONS,
    isLoading: workspace.isLoading || reservationsQuery.isPending,
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

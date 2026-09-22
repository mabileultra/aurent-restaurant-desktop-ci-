import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { orderApi } from '../../../api';
import { ORDERS_PAGE_SIZE_DEFAULT } from '../../../features/orders/constants';
import { TABLE_PAGE_SIZE_OPTIONS } from '../../../components/shared/TablePagination';
import { useRestaurantWorkspaceStore } from '../../shared/hooks/useRestaurantWorkspaceStore';
import { toastApiError } from '../../../utils/apiError';

const emptyEditForm = () => ({
  clientName: '',
  clientPhone: '',
  deliveryAddress: '',
  comment: '',
  courierId: '',
});

const emptyFilters = () => ({
  search: '',
  status: 'all',
  createdFrom: '',
  createdTo: '',
});

export function useDeliveryAdminPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const workspace = useRestaurantWorkspaceStore();
  const [filters, setFilters] = useState(emptyFilters);
  const [applied, setApplied] = useState(emptyFilters);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(ORDERS_PAGE_SIZE_DEFAULT);
  const [addOpen, setAddOpen] = useState(false);
  const [editOrderId, setEditOrderId] = useState(null);
  const [editForm, setEditForm] = useState(emptyEditForm);
  const [cancelOrder, setCancelOrder] = useState(null);

  const queryParams = useMemo(() => ({
    storeId: workspace.storeId ?? undefined,
    page,
    size: pageSize,
    search: applied.search.trim() || undefined,
    status: applied.status !== 'all' ? applied.status : undefined,
    createdFrom: applied.createdFrom || undefined,
    createdTo: applied.createdTo || undefined,
  }), [workspace.storeId, page, pageSize, applied]);

  const { data, isPending, isError, error } = useQuery({
    queryKey: ['rst-delivery', queryParams],
    queryFn: () => orderApi.getAll(queryParams).then((r) => r.data),
    enabled: workspace.storeId != null,
  });

  const couriersQuery = useQuery({
    queryKey: ['order-couriers'],
    queryFn: () => orderApi.getCouriers().then((r) => r.data),
    staleTime: 60_000,
  });

  const editDetailQuery = useQuery({
    queryKey: ['rst-delivery-order', editOrderId],
    queryFn: () => orderApi.getById(editOrderId).then((r) => r.data),
    enabled: editOrderId != null,
  });

  useEffect(() => {
    if (!editDetailQuery.data) return;
    const detail = editDetailQuery.data;
    setEditForm({
      clientName: detail.clientName ?? '',
      clientPhone: detail.clientPhone ?? '',
      deliveryAddress: detail.deliveryAddress ?? '',
      comment: detail.comment ?? '',
      courierId: detail.courierId ? String(detail.courierId) : '',
    });
  }, [editDetailQuery.data]);

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['rst-delivery'] });
  }, [queryClient]);

  const updateMutation = useMutation({
    mutationFn: () => orderApi.update(editOrderId, {
      clientName: editForm.clientName.trim(),
      clientPhone: editForm.clientPhone.trim(),
      deliveryAddress: editForm.deliveryAddress.trim(),
      comment: editForm.comment.trim() || undefined,
      courierId: editForm.courierId || null,
    }),
    onSuccess: () => {
      toast.success(t('rst.delivery.saved'));
      setEditOrderId(null);
      setEditForm(emptyEditForm());
      invalidate();
    },
    onError: (err) => toastApiError(err, t('rst.delivery.saveFailed')),
  });

  const cancelMutation = useMutation({
    mutationFn: (id) => orderApi.cancel(id),
    onSuccess: () => {
      toast.success(t('rst.delivery.cancelled'));
      setCancelOrder(null);
      invalidate();
    },
    onError: (err) => toastApiError(err, t('rst.delivery.cancelFailed')),
  });

  const rows = data?.content ?? [];
  const stats = useMemo(() => ({
    total: data?.totalElements ?? 0,
    newCount: rows.filter((r) => r.status === 'NEW').length,
    active: rows.filter((r) => r.status !== 'CANCELLED' && r.status !== 'COMPLETED').length,
    cancelled: rows.filter((r) => r.status === 'CANCELLED').length,
  }), [data?.totalElements, rows]);

  const applyFilters = useCallback(() => {
    setApplied({ ...filters });
    setPage(0);
  }, [filters]);

  const resetFilters = useCallback(() => {
    const next = emptyFilters();
    setFilters(next);
    setApplied(next);
    setPage(0);
  }, []);

  return {
    t,
    workspace,
    filters,
    setFilters,
    applyFilters,
    resetFilters,
    rows,
    stats,
    loading: isPending,
    isError,
    error,
    page,
    pageSize,
    pageSizeOptions: TABLE_PAGE_SIZE_OPTIONS,
    total: data?.totalElements ?? 0,
    totalPages: data?.totalPages ?? 0,
    setPage,
    setPageSize: (size) => {
      setPageSize(size);
      setPage(0);
    },
    addOpen,
    setAddOpen,
    onOrderCreated: invalidate,
    couriers: couriersQuery.data ?? [],
    couriersLoading: couriersQuery.isPending,
    editOrderId,
    editForm,
    setEditForm,
    editLoading: editDetailQuery.isPending,
    openEdit: (row) => {
      setEditOrderId(row.id);
      setEditForm(emptyEditForm());
      couriersQuery.refetch();
    },
    closeEdit: () => {
      setEditOrderId(null);
      setEditForm(emptyEditForm());
    },
    saveEdit: () => updateMutation.mutate(),
    savingEdit: updateMutation.isPending,
    cancelOrder,
    setCancelOrder,
    confirmCancel: () => cancelMutation.mutate(cancelOrder.id),
    cancelling: cancelMutation.isPending,
    canEditRow: (row) => row.status !== 'CANCELLED' && row.status !== 'COMPLETED',
    canCancelRow: (row) => row.status !== 'CANCELLED' && row.status !== 'COMPLETED',
  };
}

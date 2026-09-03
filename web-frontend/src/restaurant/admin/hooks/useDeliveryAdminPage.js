import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { orderApi } from '../../../api';
import { ORDERS_DEFAULT_FILTERS, ORDERS_PAGE_SIZE_DEFAULT } from '../../../features/orders/constants';
import { useRestaurantWorkspaceStore } from '../../shared/hooks/useRestaurantWorkspaceStore';

const emptyEditForm = () => ({
  clientName: '',
  clientPhone: '',
  deliveryAddress: '',
  comment: '',
  courierId: '',
});

export function useDeliveryAdminPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const workspace = useRestaurantWorkspaceStore();
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
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
    search: appliedSearch.trim() || undefined,
    status: ORDERS_DEFAULT_FILTERS.status.trim() || undefined,
  }), [workspace.storeId, page, pageSize, appliedSearch]);

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
    onError: (err) => toast.error(err?.response?.data?.message ?? t('rst.delivery.saveFailed')),
  });

  const cancelMutation = useMutation({
    mutationFn: (id) => orderApi.cancel(id),
    onSuccess: () => {
      toast.success(t('rst.delivery.cancelled'));
      setCancelOrder(null);
      invalidate();
    },
    onError: (err) => toast.error(err?.response?.data?.message ?? t('rst.delivery.cancelFailed')),
  });

  return {
    t,
    workspace,
    search,
    setSearch,
    applySearch: () => {
      setAppliedSearch(search.trim());
      setPage(0);
    },
    rows: data?.content ?? [],
    loading: isPending,
    isError,
    error,
    page,
    pageSize,
    total: data?.totalElements ?? 0,
    totalPages: data?.totalPages ?? 0,
    setPage,
    setPageSize,
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

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { orderApi } from '../../../api';
import { useRestaurantStores } from '../../../hooks/useRestaurantStores';
import { ORDERS_DEFAULT_FILTERS, ORDERS_PAGE_SIZE_DEFAULT } from '../../orders/constants';

const emptyEditForm = () => ({
  clientName: '',
  clientPhone: '',
  deliveryAddress: '',
  comment: '',
  courierId: '',
});

export function useRestaurantDeliveryPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { restaurantStores } = useRestaurantStores();
  const [storeId, setStoreId] = useState('');
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(ORDERS_PAGE_SIZE_DEFAULT);
  const [addOpen, setAddOpen] = useState(false);
  const [editOrderId, setEditOrderId] = useState(null);
  const [editForm, setEditForm] = useState(emptyEditForm);
  const [cancelOrder, setCancelOrder] = useState(null);

  const effectiveStoreId = storeId || (restaurantStores.length === 1 ? String(restaurantStores[0].id) : '');

  const queryParams = useMemo(() => ({
    storeId: effectiveStoreId ? Number(effectiveStoreId) : undefined,
    page,
    size: pageSize,
    search: appliedSearch.trim() || undefined,
    status: ORDERS_DEFAULT_FILTERS.status.trim() || undefined,
  }), [effectiveStoreId, page, pageSize, appliedSearch]);

  const { data, isPending, isError, error } = useQuery({
    queryKey: ['restaurant-delivery', queryParams],
    queryFn: () => orderApi.getAll(queryParams).then((r) => r.data),
    enabled: !!effectiveStoreId,
  });

  const couriersQuery = useQuery({
    queryKey: ['order-couriers'],
    queryFn: () => orderApi.getCouriers().then((r) => r.data),
    staleTime: 60_000,
  });

  const editDetailQuery = useQuery({
    queryKey: ['restaurant-delivery-order', editOrderId],
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
    queryClient.invalidateQueries({ queryKey: ['restaurant-delivery'] });
  }, [queryClient]);

  const applySearch = useCallback(() => {
    setAppliedSearch(search.trim());
    setPage(0);
  }, [search]);

  const onOrderCreated = useCallback(() => {
    invalidate();
  }, [invalidate]);

  const onExport = useCallback(() => {
    toast(t('orders.exportSoon'), { icon: 'ℹ️' });
  }, [t]);

  const openEdit = useCallback((row) => {
    setEditOrderId(row.id);
    setEditForm(emptyEditForm());
    couriersQuery.refetch();
  }, [couriersQuery]);

  const closeEdit = useCallback(() => {
    setEditOrderId(null);
    setEditForm(emptyEditForm());
  }, []);

  const updateMutation = useMutation({
    mutationFn: () => orderApi.update(editOrderId, {
      clientName: editForm.clientName.trim(),
      clientPhone: editForm.clientPhone.trim(),
      deliveryAddress: editForm.deliveryAddress.trim(),
      comment: editForm.comment.trim() || undefined,
      courierId: editForm.courierId || null,
    }),
    onSuccess: () => {
      toast.success(t('restaurantDelivery.saved'));
      closeEdit();
      invalidate();
    },
    onError: (err) => toast.error(err?.response?.data?.message ?? t('restaurantDelivery.saveFailed')),
  });

  const cancelMutation = useMutation({
    mutationFn: (id) => orderApi.cancel(id),
    onSuccess: () => {
      toast.success(t('restaurantDelivery.cancelled'));
      setCancelOrder(null);
      invalidate();
    },
    onError: (err) => toast.error(err?.response?.data?.message ?? t('restaurantDelivery.cancelFailed')),
  });

  return {
    t,
    restaurantStores,
    storeId: effectiveStoreId,
    setStoreId,
    search,
    setSearch,
    applySearch,
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
    onOrderCreated,
    onExport,
    couriers: couriersQuery.data ?? [],
    couriersLoading: couriersQuery.isPending,
    editOrderId,
    editForm,
    setEditForm,
    editLoading: editDetailQuery.isPending,
    openEdit,
    closeEdit,
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

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { userApi } from '../../../api';
import { ORDERS_PAGE_SIZE_DEFAULT } from '../../../features/orders/constants';
import { TABLE_PAGE_SIZE_OPTIONS } from '../../../components/shared/TablePagination';
import { useRestaurantWorkspaceStore } from '../../shared/hooks/useRestaurantWorkspaceStore';
import { rstOrderApi } from '../../api/order.api';
import { buildCouriers, buildWaiterNameById } from '../../pos/utils/floorPosDerivations';
import { toastApiError } from '../../../utils/apiError';

const emptyEditForm = () => ({
  clientName: '',
  clientPhone: '',
  deliveryAddress: '',
  comment: '',
  courierUserId: '',
});

const emptyCreateForm = () => ({
  clientName: '',
  clientPhone: '',
  deliveryAddress: '',
  comment: '',
});

const emptyFilters = () => ({
  search: '',
  status: 'all',
  deliveryStatus: 'all',
  createdFrom: '',
  createdTo: '',
});

function orderDue(order) {
  const sub = Number(order?.subtotal || 0);
  const commission = Number(order?.commissionAmount || 0);
  const discount = Number(order?.discountAmount || 0);
  return Math.max(0, sub + commission - discount);
}

export function useDeliveryAdminPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const workspace = useRestaurantWorkspaceStore();
  const [filters, setFilters] = useState(emptyFilters);
  const [applied, setApplied] = useState(emptyFilters);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(ORDERS_PAGE_SIZE_DEFAULT);
  const [addOpen, setAddOpen] = useState(false);
  const [createForm, setCreateForm] = useState(emptyCreateForm);
  const [editOrderId, setEditOrderId] = useState(null);
  const [editForm, setEditForm] = useState(emptyEditForm);
  const [cancelOrder, setCancelOrder] = useState(null);

  const queryParams = useMemo(() => ({
    channel: 'DELIVERY',
    page,
    size: pageSize,
    q: applied.search.trim() || undefined,
    status: applied.status !== 'all' ? applied.status : undefined,
    deliveryStatus: applied.deliveryStatus !== 'all' ? applied.deliveryStatus : undefined,
    openedFrom: applied.createdFrom || undefined,
    openedTo: applied.createdTo || undefined,
  }), [page, pageSize, applied]);

  const { data, isPending, isError, error } = useQuery({
    queryKey: ['rst-delivery', workspace.storeId, queryParams],
    queryFn: () => rstOrderApi.search(workspace.storeId, queryParams).then((r) => r.data),
    enabled: workspace.storeId != null,
  });

  const staffQuery = useQuery({
    queryKey: ['rst-delivery-staff', workspace.storeId],
    queryFn: () => userApi.getAll().then((r) => r.data ?? []),
    enabled: workspace.storeId != null,
    staleTime: 60_000,
  });

  const editDetailQuery = useQuery({
    queryKey: ['rst-delivery-order', editOrderId],
    queryFn: () => rstOrderApi.get(editOrderId).then((r) => r.data),
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
      courierUserId: detail.courierUserId ? String(detail.courierUserId) : '',
    });
  }, [editDetailQuery.data]);

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['rst-delivery'] });
  }, [queryClient]);

  const createMutation = useMutation({
    mutationFn: () => rstOrderApi.openDelivery(workspace.storeId, {
      clientName: createForm.clientName.trim(),
      clientPhone: createForm.clientPhone.trim(),
      deliveryAddress: createForm.deliveryAddress.trim(),
      comment: createForm.comment.trim() || undefined,
    }).then((r) => r.data),
    onSuccess: () => {
      toast.success(t('rst.delivery.created', { defaultValue: 'Заказ доставки создан' }));
      setAddOpen(false);
      setCreateForm(emptyCreateForm());
      invalidate();
    },
    onError: (err) => toastApiError(err, t('rst.delivery.createFailed', { defaultValue: 'Не удалось создать заказ' })),
  });

  const updateMutation = useMutation({
    mutationFn: () => rstOrderApi.updateDeliveryDetails(editOrderId, {
      clientName: editForm.clientName.trim(),
      clientPhone: editForm.clientPhone.trim(),
      deliveryAddress: editForm.deliveryAddress.trim(),
      comment: editForm.comment.trim() || undefined,
      courierUserId: editForm.courierUserId || null,
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
    mutationFn: (id) => rstOrderApi.cancel(id),
    onSuccess: () => {
      toast.success(t('rst.delivery.cancelled'));
      setCancelOrder(null);
      invalidate();
    },
    onError: (err) => toastApiError(err, t('rst.delivery.cancelFailed')),
  });

  const deliveryStatusMutation = useMutation({
    mutationFn: ({ orderId, deliveryStatus }) =>
      rstOrderApi.updateDeliveryStatus(orderId, { deliveryStatus }),
    onSuccess: () => {
      toast.success(t('rst.delivery.statusUpdated', { defaultValue: 'Статус доставки обновлён' }));
      invalidate();
    },
    onError: (err) => toastApiError(err, t('rst.delivery.statusFailed', { defaultValue: 'Не удалось сменить статус' })),
  });

  const couriers = useMemo(
    () => buildCouriers(staffQuery.data, workspace.storeId),
    [staffQuery.data, workspace.storeId],
  );
  const courierNameById = useMemo(() => buildWaiterNameById(staffQuery.data), [staffQuery.data]);

  const rows = data?.content ?? [];
  const stats = useMemo(() => ({
    total: data?.totalElements ?? 0,
    newCount: rows.filter((r) => r.status === 'OPEN').length,
    active: rows.filter((r) => r.status === 'OPEN' || r.status === 'BILLING').length,
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
    orderDue,
    courierNameById,
    couriers,
    couriersLoading: staffQuery.isPending,
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
    createForm,
    setCreateForm,
    createDelivery: () => createMutation.mutate(),
    creating: createMutation.isPending,
    closeAdd: () => {
      setAddOpen(false);
      setCreateForm(emptyCreateForm());
    },
    editOrderId,
    editForm,
    setEditForm,
    editLoading: editDetailQuery.isPending,
    openEdit: (row) => {
      setEditOrderId(row.id);
      setEditForm(emptyEditForm());
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
    advanceDeliveryStatus: (row, next) => {
      if (!next) return;
      deliveryStatusMutation.mutate({ orderId: row.id, deliveryStatus: next });
    },
    advancingDelivery: deliveryStatusMutation.isPending,
    canEditRow: (row) => row.status === 'OPEN' || row.status === 'BILLING',
    canCancelRow: (row) => row.status === 'OPEN' || row.status === 'BILLING',
    canAdvanceDelivery: (row) => row.status !== 'CANCELLED' && row.status !== 'REFUNDED',
  };
}

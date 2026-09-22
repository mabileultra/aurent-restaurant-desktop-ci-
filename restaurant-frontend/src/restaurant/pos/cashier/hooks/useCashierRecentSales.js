import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../../../store/authStore';
import { rstPaymentApi } from '../../../api/payment.api';
import { rstOrderApi } from '../../../api/order.api';
import { loadRestaurantReceiptSale } from '../../utils/loadRestaurantReceiptSale';
import { toastApiError } from '../../../../utils/apiError';

/**
 * Recent paid/refunded sales + open receipt for cashier panels.
 */
export function useCashierRecentSales({
  storeId,
  storeName,
  waiterNameById,
  refunded = false,
  enabled = true,
  t,
}) {
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();

  const listQuery = useQuery({
    queryKey: ['rst-recent-paid', storeId, refunded],
    queryFn: () =>
      rstPaymentApi.listRecentPaid(storeId, { refunded, limit: 40 }).then((r) => r.data ?? []),
    enabled: enabled && storeId != null,
    staleTime: 15_000,
    refetchInterval: 20_000,
  });

  const openReceiptMutation = useMutation({
    mutationFn: (row) =>
      loadRestaurantReceiptSale({
        orderId: row.id,
        storeName,
        cashierName: user?.fullName || user?.username || undefined,
        waiterNameById,
        t,
      }),
    onError: (err) => toastApiError(err, t('rst.cashier.receiptLoadFailed')),
  });

  const refundMutation = useMutation({
    mutationFn: (orderId) => rstOrderApi.refund(orderId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rst-recent-paid', storeId] });
      toast.success(t('rst.order.refunded'));
    },
    onError: (err) => toastApiError(err, t('rst.order.refundFailed')),
  });

  return {
    rows: listQuery.data ?? [],
    loading: listQuery.isPending && !listQuery.data,
    isError: listQuery.isError,
    refetch: listQuery.refetch,
    openReceipt: (row) => openReceiptMutation.mutateAsync(row),
    openingId: openReceiptMutation.isPending
      ? openReceiptMutation.variables?.id ?? null
      : null,
    receiptSale: openReceiptMutation.data ?? null,
    clearReceipt: () => openReceiptMutation.reset(),
    refund: (orderId) => refundMutation.mutateAsync(orderId),
    refunding: refundMutation.isPending,
  };
}

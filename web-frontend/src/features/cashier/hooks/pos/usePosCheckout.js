import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import {
  CASHIER_ESCPOS_TOAST,
} from '../../../../config/cashierEscposConfig';
import {
  isCashierEscposPrintAvailable,
  printFiscalReceipt,
  resolveEscposPrintErrorMessage,
} from '../../../../services/cashierEscpos';
import { isDesktopCashier } from '../../../../utils/printReceipt';
import { isDesktopOfflineBridge } from '../../../../services/offline/desktopOfflineBridge';
import { posCreateSale } from '../../../../services/pos/posDataRouter';
import { clampPayAmount, round2 } from '../../../../utils/taxAmounts';
import { useCartStore } from '../../../../store/cartStore';
import { useConnectivityStore } from '../../../../store/connectivityStore';
import { isApiUnreachableError } from '../../../../utils/apiNetworkError';
import { useAuthStore } from '../../../../store/authStore';
import { resolvePosRoute } from '../../../../services/pos/posRouteResolver';
import { resolveMultikassaFiscalErrorMessage } from '../../../../services/multikassa';

export function usePosCheckout({
  storeId,
  total,
  setPayOpen,
  setSelectedLineId,
  shift = null,
  getCheckoutLineItems: getCheckoutLineItemsOverride,
  catalogKind,
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const storeName = useConnectivityStore((s) => s.storeName);

  const clearCart = useCartStore((s) => s.clearCart);
  const defaultGetCheckoutLineItems = useCartStore((s) => s.getCheckoutLineItems);
  const getCheckoutLineItems = getCheckoutLineItemsOverride ?? defaultGetCheckoutLineItems;
  const getCheckoutOrderDiscountAmount = useCartStore((s) => s.getCheckoutOrderDiscountAmount);
  const getCheckoutOrderDiscountPercent = useCartStore((s) => s.getCheckoutOrderDiscountPercent);

  const checkoutMutation = useMutation({
    mutationFn: async (payment) => {
      const items = useCartStore.getState().items;
      return posCreateSale({
        storeId,
        payment,
        user,
        cachedShift: shift,
        storeName: storeName || shift?.storeName || '',
        getCheckoutLineItems,
        getCheckoutOrderDiscountAmount,
        getCheckoutOrderDiscountPercent,
        items,
        catalogKind,
      });
    },
    onSuccess: async (res, payment) => {
      clearCart();
      setPayOpen(false);
      setSelectedLineId(null);
      qc.invalidateQueries({ queryKey: ['pos-products'] });
      qc.invalidateQueries({ queryKey: ['pharmacy-fefo-hints'] });
      qc.invalidateQueries({ queryKey: ['cashier-shift', storeId] });
      qc.invalidateQueries({ queryKey: ['my-sales'] });
      qc.invalidateQueries({ queryKey: ['sales-ledger'] });
      const receiptNum = res.data.receiptNumber;
      const shouldPrint = payment?.printReceipt !== false;
      const offlineSaved = Boolean(res.data?.offlinePendingSync);
      toast.success(offlineSaved ? t('offline.saleSavedLocally') : t('pos.saleSuccess'));

      if (shouldPrint && isCashierEscposPrintAvailable()) {
        try {
          await printFiscalReceipt({ sale: res.data, t });
          toast.success(t('receipt.printSent'), {
            id: CASHIER_ESCPOS_TOAST.toastId,
            duration: CASHIER_ESCPOS_TOAST.successDurationMs,
          });
          return;
        } catch (err) {
          const msg = err?.message || String(err || '');
          if (!/not implemented in desktop shell/i.test(msg)) {
            toast.error(resolveEscposPrintErrorMessage(err, t), {
              id: CASHIER_ESCPOS_TOAST.toastId,
              duration: CASHIER_ESCPOS_TOAST.errorDurationMs,
            });
            return;
          }
          // stub ESC/POS — ниже обычный экран чека / window.print
        }
      }

      if (shouldPrint) {
        navigate(`/receipt/${receiptNum}`, {
          state: { autoPrint: true, fromCashier: true },
        });
        return;
      }
      if (!isDesktopCashier()) {
        navigate(`/receipt/${receiptNum}`, { state: { fromCashier: true } });
      }
    },
    onError: (e) => {
      if (e?.message === 'OFFLINE_SHIFT_REQUIRED') {
        toast.error(t('pos.shiftRequired'));
        return;
      }
      if (e?.code === 'MULTIKASSA_OFFLINE_BLOCKED' || e?.message === 'MULTIKASSA_OFFLINE_BLOCKED') {
        toast.error(t('cashRegisters.multikassa.fiscalOfflineBlocked'));
        return;
      }
      if (e?.code === 'MULTIKASSA_CAPABILITIES_LOAD_FAILED') {
        toast.error(resolveMultikassaFiscalErrorMessage(e, t));
        return;
      }
      if (e?.code === 'MULTIKASSA_FISCAL_FAILED') {
        toast.error(resolveMultikassaFiscalErrorMessage(e, t));
        return;
      }
      if (
        e?.message === 'OFFLINE_SALE_SAVE_FAILED' ||
        e?.message === 'offline_ipc_timeout' ||
        e?.message === 'offline_checkout_timeout' ||
        e?.message === 'offline_sale_save_failed'
      ) {
        toast.error(t('offline.saleSaveFailed'));
        return;
      }
      const { hasCatalog, offlineLike } = resolvePosRoute(storeId, useConnectivityStore.getState());
      if (isApiUnreachableError(e) && isDesktopOfflineBridge() && offlineLike && !hasCatalog) {
        toast.error(t('offline.openShiftNeedsCatalog'));
        return;
      }
      const msg = e.response?.data?.message ?? e.message ?? t('pos.saleFailed');
      if (msg === 'An unexpected error occurred' || e?.response?.data?.code === 'INTERNAL_ERROR') {
        toast.error(t('pos.saleFailed'), { id: 'pos-checkout-error' });
        return;
      }
      toast.error(msg, { id: 'pos-checkout-error' });
    },
  });

  const handleConfirmPayment = (payment) => {
    if (checkoutMutation.isPending) return;
    if ((payment.receiptType === 'CREDIT' || payment.receiptType === 'ADVANCE') && !payment.customerId) {
      toast.error(
        payment.receiptType === 'ADVANCE'
          ? t('pos.advanceCustomerRequired')
          : t('pos.creditCustomerRequired'),
      );
      return;
    }
    const payTotal = round2(total);
    if (payment.paymentMethod === 'MIXED' && payment.cashAmount != null) {
      const cash = clampPayAmount(payment.cashAmount, payTotal);
      const card = round2(Math.max(0, payTotal - cash));
      checkoutMutation.mutate({
        ...payment,
        cashAmount: cash,
        cardAmount: card,
        amountTendered: payment.amountTendered ?? cash,
      });
      return;
    }
    checkoutMutation.mutate(payment);
  };

  return { checkoutMutation, handleConfirmPayment };
}

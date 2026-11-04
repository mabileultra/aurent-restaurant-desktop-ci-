import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { rstOrderApi } from '../../api/order.api';
import { payRestaurantOrderWithFiscal } from '../utils/payRestaurantOrderWithFiscal';
import { saleNeedsFiscalPrint } from '../utils/printOrdinarySaleReceipt';
import {
  isCashierEscposPrintAvailable,
  printFiscalReceipt,
  resolveEscposPrintErrorMessage,
} from '../../../services/cashierEscpos';
import { CASHIER_ESCPOS_TOAST } from '../../../config/cashierEscposConfig';
import { restaurantPayTotal } from '../utils/buildRestaurantFiscalSale';
import { toPayAmountPayload } from '../utils/restaurantPayAmount';
import { toastApiError } from '../../../utils/apiError';
import { playPosSound } from '../utils/posSounds';

/** Pay + refund (+ fiscal ESC/POS path). */
export function useFloorPayMutations({
  t, storeId, storeName, order, servicePreview, waiterNameById, user, shift,
  setActiveOrderId, setPaidReceipt, closePayModal, cache,
}) {
  const { invalidateFloor, invalidateCounter, invalidateShift, invalidateRecentPaid, errMsg } = cache;

  const payMutation = useMutation({
    mutationFn: async (payload = {}) => {
      if (!order?.id) throw new Error('ORDER_MISSING');
      const channel = order.channel || 'DINE_IN';
      const orderForPay = {
        ...order,
        channel,
        servicePercent: order.servicePercent != null
          ? order.servicePercent : (servicePreview?.percent ?? 0),
        serviceAmount: order.serviceAmount != null
          ? order.serviceAmount
          : (channel === 'DINE_IN' ? (servicePreview?.amount ?? 0) : 0),
      };
      const due = toPayAmountPayload(
        payload.amount ?? restaurantPayTotal(orderForPay, servicePreview),
      );
      const method = payload.method || 'CASH';
      const waiterName = orderForPay.waiterUserId
        ? waiterNameById.get(String(orderForPay.waiterUserId)) : null;
      const customerLabel = channel === 'DINE_IN'
        ? (orderForPay.tableCode ? t('rst.order.receiptTable', { code: orderForPay.tableCode }) : null)
        : (orderForPay.clientName || null);
      return payRestaurantOrderWithFiscal({
        order: orderForPay,
        method,
        amount: due,
        cashAmount: payload.cashAmount,
        cardAmount: payload.cardAmount,
        amountTendered: payload.amountTendered,
        changeGiven: payload.changeGiven,
        cardType: payload.cardType || null,
        debtPhone: payload.debtPhone,
        debtComment: payload.debtComment,
        advancePaid: payload.advancePaid,
        storeId, storeName,
        shiftId: shift?.id ?? null,
        cashRegisterId: shift?.cashRegisterId ?? null,
        cashierName: user?.fullName || user?.username || undefined,
        waiterName, customerLabel, t,
      });
    },
    onSuccess: async (result) => {
      setActiveOrderId(null);
      closePayModal?.();
      invalidateFloor();
      invalidateCounter();
      invalidateShift();
      invalidateRecentPaid();
      playPosSound('success');
      toast.success(t('rst.order.paid'));
      // Always signal guest display THANKS via paidReceipt.sale.
      // Modal print only when fiscal needed and ESC/POS is unavailable (cfdOnly skips pane).
      if (result?.sale) {
        const needsFiscal = saleNeedsFiscalPrint(result.sale);
        const escpos = needsFiscal && isCashierEscposPrintAvailable();
        if (escpos) {
          try {
            await printFiscalReceipt({ sale: result.sale, t, useModalShell: false });
            toast.success(t('receipt.printSent'), {
              id: CASHIER_ESCPOS_TOAST.toastId,
              duration: CASHIER_ESCPOS_TOAST.successDurationMs,
            });
          } catch (e) {
            playPosSound('error');
            toast.error(
              resolveEscposPrintErrorMessage(e, t) ?? t('receipt.printFailed'),
              {
                id: CASHIER_ESCPOS_TOAST.toastId,
                duration: CASHIER_ESCPOS_TOAST.errorDurationMs,
              },
            );
          }
        }
        const showPrintModal = needsFiscal && !escpos;
        setPaidReceipt({
          sale: result.sale,
          autoPrint: showPrintModal,
          cfdOnly: !showPrintModal,
        });
      }
    },
    onError: (err) => {
      playPosSound('error');
      if (err?.code === 'MARKING_NO_INTEGRATION' || err?.message === 'MARKING_NO_INTEGRATION') {
        toast.error(t('rst.integrations.markingApiDisabled'));
        return;
      }
      if (err?.code === 'MULTIKASSA_OFFLINE_BLOCKED' || err?.message === 'MULTIKASSA_OFFLINE_BLOCKED') {
        toast.error(t('cashRegisters.multikassa.fiscalOfflineBlocked'));
        return;
      }
      if (err?.code === 'MULTIKASSA_FISCAL_FAILED') {
        toast.error(err.message || t('cashRegisters.multikassa.fiscalFailed'));
        return;
      }
      toastApiError(err, t('rst.order.payFailed'));
    },
  });

  const refundMutation = useMutation({
    mutationFn: (orderId) => rstOrderApi.refund(orderId),
    onSuccess: () => {
      setPaidReceipt(null);
      invalidateShift();
      invalidateRecentPaid();
      toast.success(t('rst.order.refunded'));
    },
    onError: (err) => errMsg(err, 'rst.order.refundFailed'),
  });

  return { payMutation, refundMutation };
}

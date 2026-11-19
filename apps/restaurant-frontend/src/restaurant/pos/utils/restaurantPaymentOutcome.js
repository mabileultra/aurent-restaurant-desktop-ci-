import { FISCAL_STATUS } from '../../../services/fiscal';
import { buildRestaurantFiscalSale } from './buildRestaurantFiscalSale';
import { enqueuePendingFiscal } from './pendingFiscalQueue';
import { persistRestaurantPaymentFiscal } from './persistRestaurantPaymentFiscal';

export function pendingFiscalFromError(err) {
  return {
    fiscalStatus: FISCAL_STATUS.PENDING,
    fiscalSign: null,
    fiscalReceiptSeq: null,
    multikassaSaleId: null,
    fiscalQrUrl: null,
    fiscalTerminalId: null,
    fiscalError: err?.message || 'Pending fiscal sync',
    multikassaRetryBody: null,
    clientOperationId: null,
  };
}

export async function buildRestaurantPaymentOutcome({
  order,
  paidOrder,
  payMethod,
  payAmount,
  cash,
  payment,
  tendered,
  change,
  fiscalPayload,
  cashierName,
  waiterName,
  storeName,
  storeId,
  cashRegisterId,
  customerLabel,
}) {
  const sale = buildRestaurantFiscalSale({
    order: {
      ...paidOrder,
      serviceAmount: paidOrder.serviceAmount ?? order.serviceAmount,
      servicePercent: paidOrder.servicePercent ?? order.servicePercent,
      commissionAmount: paidOrder.commissionAmount ?? order.commissionAmount,
      commissionPercent: paidOrder.commissionPercent ?? order.commissionPercent,
      items: paidOrder.items?.length ? paidOrder.items : order.items,
    },
    paymentMethod: payMethod,
    amount: payAmount,
    cashAmount: cash,
    cardAmount: payment.cardAmount,
    amountTendered: tendered,
    changeGiven: change,
    cardType: payment.cardType,
    cardCategory: payment.cardCategory,
    rrn: payment.rrn,
    socialCardNumber: payment.socialCardNumber,
    fiscal: fiscalPayload,
    cashierName,
    waiterName,
    storeName,
    storeId,
    customerLabel,
  });

  if (fiscalPayload?.fiscalStatus === FISCAL_STATUS.PENDING) {
    enqueuePendingFiscal({
      storeId,
      cashRegisterId,
      orderId: order?.id,
      fiscal: fiscalPayload,
    });
  }

  if (order?.id && fiscalPayload) {
    await persistRestaurantPaymentFiscal(order.id, fiscalPayload);
  }

  return { order: paidOrder, sale, fiscal: fiscalPayload };
}

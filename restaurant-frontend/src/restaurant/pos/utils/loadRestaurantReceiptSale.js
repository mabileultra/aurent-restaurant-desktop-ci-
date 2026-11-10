import { rstOrderApi } from '../../api/order.api';
import { rstPaymentApi } from '../../api/payment.api';
import { buildRestaurantFiscalSale } from './buildRestaurantFiscalSale';

function channelCustomerLabel(order, t) {
  if (order?.channel === 'DINE_IN') {
    return order.tableCode
      ? t('rst.order.receiptTable', { code: order.tableCode })
      : null;
  }
  return order?.clientName || null;
}

/** Map payment OFD columns → fiscal bag (QR rebuilt in buildQrPayload). */
function fiscalFromPayment(payment) {
  if (!payment?.fiscalStatus && !payment?.fiscalSign && !payment?.multikassaSaleId) {
    return null;
  }
  return {
    fiscalStatus: payment.fiscalStatus || null,
    fiscalSign: payment.fiscalSign || null,
    fiscalReceiptSeq: payment.fiscalReceiptSeq || null,
    multikassaSaleId: payment.multikassaSaleId || null,
    fiscalTerminalId: payment.fiscalTerminalId || null,
    fiscalizedAt: payment.fiscalizedAt || null,
    fiscalQrUrl: null,
  };
}

/**
 * Load closed order + payment and build FiscalReceiptBody-compatible sale.
 */
export async function loadRestaurantReceiptSale({
  orderId,
  storeName,
  cashierName,
  waiterNameById,
  t,
}) {
  const [orderRes, paymentRes] = await Promise.all([
    rstOrderApi.get(orderId),
    rstPaymentApi.getPayment(orderId),
  ]);
  const order = orderRes.data;
  const payment = paymentRes.data;
  const waiterName = order?.waiterUserId
    ? waiterNameById?.get?.(String(order.waiterUserId))
    : null;

  return buildRestaurantFiscalSale({
    order,
    paymentMethod: payment?.method || 'CASH',
    amount: payment?.amount,
    cashAmount: payment?.cashAmount,
    cardAmount: payment?.cardAmount,
    amountTendered: payment?.amountTendered,
    changeGiven: payment?.changeGiven,
    cardType: payment?.cardType || null,
    fiscal: fiscalFromPayment(payment),
    storeId: order?.storeId,
    storeName,
    cashierName,
    waiterName,
    customerLabel: channelCustomerLabel(order, t),
  });
}

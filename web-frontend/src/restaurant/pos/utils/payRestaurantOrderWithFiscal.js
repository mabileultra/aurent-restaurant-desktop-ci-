import { rstOrderApi } from '../../api/order.api';
import {
  fiscalizeSaleBeforeCommit,
  loadMultikassaCapabilities,
  resolveMultikassaFiscalErrorMessage,
  wrapMultikassaFiscalError,
} from '../../../services/multikassa';
import {
  buildRestaurantFiscalSale,
  orderToMultikassaCartItems,
  restaurantPayTotal,
} from './buildRestaurantFiscalSale';

/**
 * Фискализация (Multikassa, если включена) → оплата заказа → sale-like для экрана/печати.
 */
export async function payRestaurantOrderWithFiscal({
  order,
  method,
  amount,
  storeId,
  storeName,
  shiftId = null,
  cashRegisterId = null,
  cashierName,
  waiterName,
  customerLabel,
  serviceLabel,
  t,
}) {
  const total = restaurantPayTotal(order);
  const payAmount = amount != null ? Number(amount) : total;
  const payment = {
    paymentMethod: method,
    receiptType: 'SALE',
    cashAmount: method === 'CASH' ? payAmount : 0,
    cardAmount: method === 'CARD' ? payAmount : 0,
    amountTendered: payAmount,
  };

  const cartItems = orderToMultikassaCartItems(order, { serviceLabel });
  let fiscalPayload = null;
  try {
    const capabilities = await loadMultikassaCapabilities(storeId, cashRegisterId);
    fiscalPayload = await fiscalizeSaleBeforeCommit({
      capabilities,
      cartItems,
      payment,
      total: payAmount,
      shiftId,
      cashierName: cashierName || 'CASHIER',
      contractorName: storeName,
      offline: false,
      clientSaleId: order?.id ? `rst-${order.id}` : null,
    });
  } catch (err) {
    const wrapped = wrapMultikassaFiscalError(err);
    wrapped.message = resolveMultikassaFiscalErrorMessage(wrapped, t) || wrapped.message;
    throw wrapped;
  }

  const res = await rstOrderApi.pay(order.id, {
    method,
    amount: payAmount,
  });
  const paidOrder = res.data;

  const sale = buildRestaurantFiscalSale({
    order: {
      ...paidOrder,
      commissionAmount: paidOrder.commissionAmount ?? order.commissionAmount,
      commissionPercent: paidOrder.commissionPercent ?? order.commissionPercent,
      items: paidOrder.items?.length ? paidOrder.items : order.items,
    },
    paymentMethod: method,
    amount: payAmount,
    fiscal: fiscalPayload,
    cashierName,
    waiterName,
    storeName,
    storeId,
    serviceLabel,
    customerLabel,
  });

  return { order: paidOrder, sale, fiscal: fiscalPayload };
}

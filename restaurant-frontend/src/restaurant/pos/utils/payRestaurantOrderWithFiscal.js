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
import { toPayAmountPayload } from './restaurantPayAmount';
import { round2 } from '../../../utils/taxAmounts';

/**
 * Фискализация (Multikassa, если включена) → оплата заказа → sale-like для экрана/печати.
 */
export async function payRestaurantOrderWithFiscal({
  order,
  method,
  amount,
  cashAmount,
  cardAmount,
  amountTendered,
  changeGiven,
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
  const payAmount = toPayAmountPayload(amount != null ? Number(amount) : total);
  const payMethod = String(method || 'CASH').toUpperCase();

  let cash = cashAmount != null ? round2(cashAmount) : null;
  let card = cardAmount != null ? round2(cardAmount) : null;
  let tendered = amountTendered != null ? round2(amountTendered) : null;
  let change = changeGiven != null ? round2(changeGiven) : null;

  if (payMethod === 'CASH') {
    cash = payAmount;
    card = 0;
    tendered = tendered != null && tendered >= payAmount ? tendered : payAmount;
    change = round2(Math.max(0, tendered - payAmount));
  } else if (payMethod === 'CARD') {
    cash = 0;
    card = payAmount;
    tendered = payAmount;
    change = 0;
  } else if (payMethod === 'MIXED') {
    cash = cash != null ? cash : 0;
    card = card != null ? card : round2(Math.max(0, payAmount - cash));
    tendered = tendered != null ? tendered : cash;
    change = change != null ? change : round2(Math.max(0, tendered - cash));
  }

  const payment = {
    paymentMethod: payMethod,
    receiptType: 'SALE',
    cashAmount: cash,
    cardAmount: card,
    amountTendered: tendered,
    changeGiven: change,
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
    method: payMethod,
    amount: payAmount,
    cashAmount: cash,
    cardAmount: card,
    amountTendered: tendered,
    changeGiven: change,
  });
  const paidOrder = res.data;

  const sale = buildRestaurantFiscalSale({
    order: {
      ...paidOrder,
      commissionAmount: paidOrder.commissionAmount ?? order.commissionAmount,
      commissionPercent: paidOrder.commissionPercent ?? order.commissionPercent,
      items: paidOrder.items?.length ? paidOrder.items : order.items,
    },
    paymentMethod: payMethod,
    amount: payAmount,
    cashAmount: cash,
    cardAmount: card,
    amountTendered: tendered,
    changeGiven: change,
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
